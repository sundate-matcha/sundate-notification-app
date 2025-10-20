// Server-Sent Events service for real-time notification updates
export class SSEService {
  private eventSource: EventSource | null = null;
  private reconnectInterval: number = 5000; // 5 seconds
  private maxReconnectAttempts: number = 3;
  private reconnectAttempts: number = 0;
  private isConnected: boolean = false;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  connect(userId: string, onMessage: (data: any) => void, onError?: (error: Event) => void): void {
    if (this.eventSource) {
      this.disconnect();
    }

    let url = `${this.baseUrl}/api/notifications/stream`;

    if (userId !== "demo-user-id") {
      url += `?userId=${userId}`;
    }
    
    try {
      this.eventSource = new EventSource(url);
      
      this.eventSource.onopen = () => {
        console.log('SSE connection opened');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.isConnected = false;
        
        if (onError) {
          onError(error);
        }

        // Attempt to reconnect
        this.attemptReconnect(userId, onMessage, onError);
      };

      // Listen for specific event types
      this.eventSource.addEventListener('new-notification', (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage({ type: 'new-notification', data });
        } catch (error) {
          console.error('Error parsing new-notification event:', error);
        }
      });

      this.eventSource.addEventListener('notification-updated', (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage({ type: 'notification-updated', data });
        } catch (error) {
          console.error('Error parsing notification-updated event:', error);
        }
      });

      this.eventSource.addEventListener('notification-deleted', (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage({ type: 'notification-deleted', data });
        } catch (error) {
          console.error('Error parsing notification-deleted event:', error);
        }
      });

    } catch (error) {
      console.error('Error creating SSE connection:', error);
      if (onError) {
        onError(error as Event);
      }
    }
  }

  private attemptReconnect(userId: string, onMessage: (data: any) => void, onError?: (error: Event) => void): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect(userId, onMessage, onError);
    }, this.reconnectInterval);
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      console.log('SSE connection closed');
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Fallback polling mechanism for when SSE is not available
  startPolling(userId: string, onUpdate: (data: any) => void, interval: number = 30000): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/notifications?userId=${userId}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          if (data.notifications && data.notifications.length > 0) {
            // Check for new notifications since last check
            const lastCheck = localStorage.getItem('lastNotificationCheck');
            const newNotifications = data.notifications.filter((notification: any) => {
              if (!lastCheck) return true;
              return new Date(notification.createdAt) > new Date(lastCheck);
            });

            newNotifications.forEach((notification: any) => {
              onUpdate({ type: 'new-notification', data: notification });
            });

            localStorage.setItem('lastNotificationCheck', new Date().toISOString());
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);
  }
}

export const sseService = new SSEService();
