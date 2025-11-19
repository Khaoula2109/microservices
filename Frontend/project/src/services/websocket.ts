// WebSocket service for real-time notifications using Socket.IO
import { io, Socket } from 'socket.io-client';

interface NotificationMessage {
  id: string;
  type: string;
  title: string;
  message: string;
  userId?: number;
  ticketId?: number;
  timestamp: string;
  read: boolean;
  data?: any;
}

type NotificationCallback = (notification: NotificationMessage) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: NotificationCallback[] = [];
  private userId: number | null = null;
  private isConnected: boolean = false;

  connect(userId: number): void {
    this.userId = userId;

    // Connect to notification-service on port 3001
    const wsUrl = `${window.location.protocol}//${window.location.hostname}:3001`;

    try {
      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 5000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.isConnected = true;

        // Subscribe to user-specific notifications
        this.socket?.emit('subscribe', { userId });
      });

      this.socket.on('notification', (notification: NotificationMessage) => {
        this.notifyListeners(notification);
      });

      this.socket.on('broadcast', (notification: NotificationMessage) => {
        this.notifyListeners(notification);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error.message);
      });

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }

  disconnect(): void {
    if (this.socket) {
      if (this.userId) {
        this.socket.emit('unsubscribe', { userId: this.userId });
      }
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  addListener(callback: NotificationCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(notification: NotificationMessage): void {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
export type { NotificationMessage, NotificationCallback };
