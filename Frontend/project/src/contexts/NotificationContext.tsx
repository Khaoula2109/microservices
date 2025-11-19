import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { websocketService, NotificationMessage } from '../services/websocket';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  ticketId?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  simulatorEnabled: boolean;
  toggleSimulator: () => void;
  isConnected: boolean;
}

// Map WebSocket notification types to UI notification types
const mapNotificationType = (wsType: string): 'info' | 'success' | 'warning' | 'error' => {
  switch (wsType) {
    case 'TICKET_PURCHASED':
    case 'TICKET_VALIDATED':
    case 'TICKET_RECEIVED':
      return 'success';
    case 'TICKET_TRANSFERRED':
      return 'info';
    case 'REFUND_STATUS':
      return 'warning';
    case 'SYSTEM':
      return 'info';
    default:
      return 'info';
  }
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Simulated notifications data
const simulatedNotifications = [
  { type: 'info' as const, title: 'Bus 42 en approche', message: 'Le bus 42 arrive dans 5 minutes à votre arrêt habituel.' },
  { type: 'success' as const, title: 'Ticket validé', message: 'Votre ticket journalier a été validé avec succès.' },
  { type: 'warning' as const, title: 'Retard signalé', message: 'La ligne 15 accuse un retard de 10 minutes.' },
  { type: 'info' as const, title: 'Nouvelle promotion', message: 'Profitez de -20% sur les abonnements mensuels ce weekend!' },
  { type: 'success' as const, title: 'Achat confirmé', message: 'Votre achat de 3 tickets simples a été confirmé.' },
  { type: 'warning' as const, title: 'Ticket expire bientôt', message: 'Votre pass hebdomadaire expire dans 24 heures.' },
  { type: 'info' as const, title: 'Travaux ligne 8', message: 'Déviation temporaire sur la ligne 8 du 20 au 25 novembre.' },
  { type: 'error' as const, title: 'Service interrompu', message: 'La ligne 3 est temporairement interrompue suite à un incident.' },
  { type: 'success' as const, title: 'Abonnement renouvelé', message: 'Votre abonnement mensuel a été renouvelé automatiquement.' },
  { type: 'info' as const, title: 'Nouveau service', message: 'La ligne express E1 est maintenant disponible!' },
];

interface NotificationProviderProps {
  children: ReactNode;
  userId?: number | null;
}

export function NotificationProvider({ children, userId }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        return JSON.parse(saved).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [simulatorEnabled, setSimulatorEnabled] = useState(() => {
    return localStorage.getItem('notificationSimulator') === 'true';
  });

  const [isConnected, setIsConnected] = useState(false);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Save simulator state
  useEffect(() => {
    localStorage.setItem('notificationSimulator', simulatorEnabled.toString());
  }, [simulatorEnabled]);

  // WebSocket connection
  useEffect(() => {
    if (userId) {
      websocketService.connect(userId);

      // Check connection status periodically
      const statusInterval = setInterval(() => {
        setIsConnected(websocketService.getConnectionStatus());
      }, 1000);

      // Add listener for incoming WebSocket notifications
      const removeListener = websocketService.addListener((wsNotification: NotificationMessage) => {
        const notification: Omit<Notification, 'id' | 'timestamp' | 'read'> = {
          type: mapNotificationType(wsNotification.type),
          title: wsNotification.title,
          message: wsNotification.message,
          ticketId: wsNotification.ticketId,
        };
        addNotification(notification);

        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(wsNotification.title, {
            body: wsNotification.message,
            icon: '/icons/icon-192x192.png',
          });
        }
      });

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return () => {
        clearInterval(statusInterval);
        removeListener();
        websocketService.disconnect();
      };
    }
  }, [userId, addNotification]);

  // Notification simulator (for testing)
  useEffect(() => {
    if (!simulatorEnabled) return;

    const interval = setInterval(() => {
      const randomNotif = simulatedNotifications[Math.floor(Math.random() * simulatedNotifications.length)];
      addNotification(randomNotif);
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [simulatorEnabled, addNotification]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep max 50 notifications
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const toggleSimulator = useCallback(() => {
    setSimulatorEnabled(prev => !prev);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
        simulatorEnabled,
        toggleSimulator,
        isConnected,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
