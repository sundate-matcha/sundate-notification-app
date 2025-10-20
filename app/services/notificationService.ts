import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NOTIFICATION_CONFIG } from '../config/notificationConfig';
import { sseService } from './sseService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'reservation_created' | 'reservation_confirmed' | 'reservation_cancelled' | 'reservation_updated' | 'reservation_reminder' | 'system' | 'promotional';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  reservationId?: string;
  userId: string;
}

export interface NotificationResponse {
  notifications: NotificationData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class NotificationService {
  private baseUrl: string;
  private userId: string | null = null;
  private eventSource: EventSource | null = null;
  private requestCache: Map<string, Promise<any>> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between requests
  private readonly CACHE_DURATION = 5000; // 5 seconds cache duration
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private isPolling = false;

  constructor() {
    // In production, this should come from environment variables
    this.baseUrl = `${NOTIFICATION_CONFIG.API_BASE_URL}/notifications`;
    this.loadUserId();
  }

  private async loadUserId(): Promise<void> {
    try {
      this.userId = await AsyncStorage.getItem(NOTIFICATION_CONFIG.STORAGE_KEYS.USER_ID);
    } catch (error) {
      console.error('Error loading user ID:', error);
      // Fallback: try to get from a simple in-memory storage for web
      if (Platform.OS === 'web') {
        try {
          // @ts-ignore
          this.userId = global.__userId || null;
        } catch (fallbackError) {
          console.warn('Fallback user ID loading also failed:', fallbackError);
        }
      }
    }
  }

  async setUserId(userId: string): Promise<void> {
    this.userId = userId;
    try {
      await AsyncStorage.setItem(NOTIFICATION_CONFIG.STORAGE_KEYS.USER_ID, userId);
    } catch (error) {
      console.error('Error setting user ID in AsyncStorage:', error);
      // Fallback for web
      if (Platform.OS === 'web') {
        try {
          // @ts-ignore
          global.__userId = userId;
        } catch (fallbackError) {
          console.warn('Fallback user ID setting also failed:', fallbackError);
        }
      }
    }
  }

  private async rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
    const cacheKey = `${url}-${JSON.stringify(options || {})}`;
    const now = Date.now();
    
    // Check if we have a cached request in progress
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey)!;
    }
    
    // Check rate limiting
    const lastRequest = this.lastRequestTime.get(cacheKey) || 0;
    const timeSinceLastRequest = now - lastRequest;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const delay = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Create the request promise
    const requestPromise = fetch(url, options).finally(() => {
      // Clean up cache after request completes
      setTimeout(() => {
        this.requestCache.delete(cacheKey);
      }, this.CACHE_DURATION);
    });
    
    // Cache the request and update last request time
    this.requestCache.set(cacheKey, requestPromise);
    this.lastRequestTime.set(cacheKey, Date.now());
    
    return requestPromise;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Get push token
      const token = await this.getPushToken();
      if (token) {
        await this.registerPushToken(token);
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  private async getPushToken(): Promise<string | null> {
    try {
      // Get projectId from app.json or environment
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.warn('No projectId found in app.json. Push notifications may not work properly.');
        console.warn('Please add projectId to app.json under extra.eas.projectId');
        // Try to get token without projectId (may work in some cases)
        const token = await Notifications.getExpoPushTokenAsync();
        return token.data;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      });
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  private async registerPushToken(token: string): Promise<void> {
    try {
      // In production, send this token to your backend
      console.log('Push token:', token);
      // await fetch(`${this.baseUrl}/register-token`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token, userId: this.userId })
      // });
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }

  async fetchNotifications(params: {
    page?: number;
    limit?: number;
    includeRead?: boolean;
    includeArchived?: boolean;
    type?: string;
    prioritizeTimeSensitive?: boolean;
  } = {}): Promise<NotificationResponse> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    const queryParams = new URLSearchParams({
      userId: this.userId,
      page: (params.page || 1).toString(),
      limit: (params.limit || 20).toString(),
      includeRead: (params.includeRead ?? true).toString(),
      includeArchived: (params.includeArchived ?? false).toString(),
      prioritizeTimeSensitive: (params.prioritizeTimeSensitive ?? true).toString(),
      ...(params.type && { type: params.type }),
    });

    try {
      const response = await this.rateLimitedFetch(`${this.baseUrl}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async fetchTimeSensitiveNotifications(params: {
    page?: number;
    limit?: number;
    includeRead?: boolean;
    includeArchived?: boolean;
  } = {}): Promise<NotificationResponse> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    const queryParams = new URLSearchParams({
      userId: this.userId,
      page: (params.page || 1).toString(),
      limit: (params.limit || 20).toString(),
      includeRead: (params.includeRead ?? true).toString(),
      includeArchived: (params.includeArchived ?? false).toString(),
    });

    try {
      const response = await this.rateLimitedFetch(`${this.baseUrl}/time-sensitive?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching time-sensitive notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    if (!this.userId) {
      return 0;
    }

    try {
      const response = await this.rateLimitedFetch(`${this.baseUrl}/unread-count?userId=${this.userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.unreadCount || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAsUnread(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${notificationId}/unread`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}/mark-all-read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  async archiveNotification(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${notificationId}/archive`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Server-Sent Events for real-time updates
  startListeningForUpdates(
    onUpdate: (notification: NotificationData) => void,
    onReservationUpdate?: (reservation: any) => void
  ): void {
    if (!this.userId) {
      console.warn('Cannot start listening for updates: User ID not set');
      return;
    }

    // Try SSE first, fallback to polling
    try {
      // Subscribe to notification and reservation events
      const eventTypes = [
        'notification_created',
        'notification_read',
        'reservation_created',
        'reservation_updated',
        'reservation_confirmed',
        'reservation_cancelled',
        'reservation_deleted'
      ];

      sseService.connect(
        this.userId,
        (data) => {
          // Handle notification events
          if (data.type === 'notification_created') {
            const notification = data.data?.notification || data.data;
            onUpdate(notification);
            this.showLocalNotification(notification);
          } else if (data.type === 'notification_read') {
            // Optionally handle notification read events
            console.log('Notification marked as read:', data.data);
          }
          
          // Handle reservation events if callback is provided
          if (onReservationUpdate) {
            if (data.type === 'reservation_created') {
              console.log('New reservation created:', data.data?.reservation);
              onReservationUpdate({ type: 'created', reservation: data.data?.reservation });
            } else if (data.type === 'reservation_updated') {
              console.log('Reservation updated:', data.data?.reservation);
              onReservationUpdate({ type: 'updated', reservation: data.data?.reservation });
            } else if (data.type === 'reservation_confirmed') {
              console.log('Reservation confirmed:', data.data?.reservation);
              onReservationUpdate({ type: 'confirmed', reservation: data.data?.reservation });
            } else if (data.type === 'reservation_cancelled') {
              console.log('Reservation cancelled:', data.data?.reservation);
              onReservationUpdate({ type: 'cancelled', reservation: data.data?.reservation });
            } else if (data.type === 'reservation_deleted') {
              console.log('Reservation deleted:', data.data?.reservation);
              onReservationUpdate({ type: 'deleted', reservation: data.data?.reservation });
            }
          }
        },
        (error) => {
          console.warn('SSE connection failed, falling back to polling:', error);
          this.startPollingForUpdates(onUpdate);
        },
        eventTypes
      );
    } catch (error) {
      console.warn('SSE not available, using polling:', error);
      this.startPollingForUpdates(onUpdate);
    }
  }

  private startPollingForUpdates(onUpdate: (notification: NotificationData) => void): void {
    if (this.isPolling) {
      return; // Prevent multiple polling instances
    }
    
    this.isPolling = true;
    
    // Poll every 30 seconds for new notifications
    this.pollingInterval = setInterval(async () => {
      if (!this.isPolling) {
        return;
      }
      
      try {
        const response = await this.fetchNotifications({ limit: 5 });
        const latestNotifications = response.notifications;
        
        // Check if there are new notifications
        let lastCheckTime: string | null = null;
        try {
          lastCheckTime = await AsyncStorage.getItem(NOTIFICATION_CONFIG.STORAGE_KEYS.LAST_NOTIFICATION_CHECK);
        } catch (error) {
          console.warn('Error getting last check time from AsyncStorage:', error);
        }
        
        const currentTime = new Date().toISOString();
        
        if (lastCheckTime) {
          const newNotifications = latestNotifications.filter(
            notification => new Date(notification.createdAt) > new Date(lastCheckTime!)
          );
          
          newNotifications.forEach(notification => {
            onUpdate(notification);
            this.showLocalNotification(notification);
          });
        }
        
        try {
          await AsyncStorage.setItem(NOTIFICATION_CONFIG.STORAGE_KEYS.LAST_NOTIFICATION_CHECK, currentTime);
        } catch (error) {
          console.warn('Error setting last check time in AsyncStorage:', error);
        }
      } catch (error) {
        console.error('Error polling for updates:', error);
      }
    }, NOTIFICATION_CONFIG.POLLING_INTERVAL);
  }

  private async showLocalNotification(notification: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: { notificationId: notification.id },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  stopListeningForUpdates(): void {
    sseService.disconnect();
    
    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    
    console.log('Stopped listening for updates');
  }

  // Handle notification interactions
  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const notificationId = response.notification.request.content.data?.notificationId;
    
    if (notificationId && typeof notificationId === 'string') {
      await this.markAsRead(notificationId);
    }
  }
}

export const notificationService = new NotificationService();
