// Server-Sent Events service for real-time notification updates
import { API_BASE_URL } from '@/config/general.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NOTIFICATION_CONFIG } from '../config/notification.config';

export class SSEService {
  private eventSource: EventSource | null = null;
  private reconnectInterval: number = 5000; // 5 seconds
  private maxReconnectAttempts: number = 3;
  private reconnectAttempts: number = 0;
  private isConnected: boolean = false;
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  connect(
    userId: string | null,
    onMessage: (data: any) => void,
    onError?: (error: Event) => void,
    eventTypes?: string[]
  ): void {
    if (this.eventSource) {
      this.disconnect();
    }

    // Check if EventSource is available (only on web platform)
    if (typeof EventSource === 'undefined') {
      console.warn('EventSource is not supported on this platform. Falling back to polling.');
      if (onError) {
        onError(new Event('platform_not_supported'));
      }
      return;
    }

    let url = `${this.baseUrl}/api/notifications/stream`;

    // Handle null userId (admin mode) or regular userId
    if (userId === null) {
      // Admin mode - no userId query param
    } else if (userId && userId !== 'demo-user-id') {
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
        this.attemptReconnect(userId, onMessage, onError, eventTypes);
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

  private attemptReconnect(
    userId: string | null,
    onMessage: (data: any) => void,
    onError?: (error: Event) => void,
    eventTypes?: string[]
  ): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect(userId, onMessage, onError, eventTypes);
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
  startPolling(userId: string | null, onUpdate: (data: any) => void, interval: number = 30000): number {
    return setInterval(async () => {
      try {
        // Skip polling if userId is null (admin mode should use SSE, not polling)
        if (userId === null) {
          console.warn('Cannot poll for notifications: userId is null (admin mode)');
          return;
        }

        const response = await fetch(`${this.baseUrl}/api/notifications?userId=${userId}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          if (data.notifications && data.notifications.length > 0) {
            // Check for new notifications since last check
            let lastCheck: string | null = null;
            try {
              lastCheck = await AsyncStorage.getItem(NOTIFICATION_CONFIG.STORAGE_KEYS.LAST_NOTIFICATION_CHECK);
            } catch (storageError) {
              console.warn('Error reading last check time:', storageError);
            }

            const newNotifications = data.notifications.filter((notification: any) => {
              if (!lastCheck) return true;
              return new Date(notification.createdAt) > new Date(lastCheck);
            });

            newNotifications.forEach((notification: any) => {
              onUpdate({ type: 'new-notification', data: notification });
            });

            try {
              await AsyncStorage.setItem(
                NOTIFICATION_CONFIG.STORAGE_KEYS.LAST_NOTIFICATION_CHECK,
                new Date().toISOString()
              );
            } catch (storageError) {
              console.warn('Error saving last check time:', storageError);
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);
  }
}

export const sseService = new SSEService();
