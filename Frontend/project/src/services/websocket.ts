// WebSocket service for real-time notifications

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
  private socket: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private listeners: NotificationCallback[] = [];
  private userId: number | null = null;
  private isConnected: boolean = false;

  connect(userId: number): void {
    this.userId = userId;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8083/ws`;

    try {
      // Use SockJS for fallback support
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Subscribe to user-specific channel
        this.subscribe(`/topic/user/${userId}`);
        // Subscribe to broadcast channel
        this.subscribe('/topic/broadcast');
      };

      this.socket.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data) as NotificationMessage;
          this.notifyListeners(notification);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private subscribe(destination: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Send STOMP SUBSCRIBE frame
      const subscribeFrame = `SUBSCRIBE\ndestination:${destination}\nid:sub-${Date.now()}\n\n\0`;
      this.socket.send(subscribeFrame);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, this.reconnectInterval * this.reconnectAttempts);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
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
