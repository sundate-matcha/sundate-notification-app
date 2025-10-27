import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { NOTIFICATION_CONFIG } from "../config/notificationConfig";
import { sseService } from "./sseService";

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
  type:
    | "reservation_created"
    | "reservation_confirmed"
    | "reservation_cancelled"
    | "reservation_updated"
    | "reservation_reminder"
    | "system"
    | "promotional";
  priority: "low" | "normal" | "high" | "urgent";
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
  private requestCache: Map<string, Promise<any>> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between requests
  private readonly CACHE_DURATION = 5000; // 5 seconds cache duration
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private isPolling = false;

  constructor() {
    // In production, this should come from environment variables
    this.baseUrl = `${NOTIFICATION_CONFIG.API_BASE_URL}/notifications`;
    // Start loading userId asynchronously - don't await it
    // This prevents blocking and errors during initialization
    this.loadUserId().catch(() => {
      // Silently fail - userId is optional and will be set later
    });
  }

  private async loadUserId(): Promise<void> {
    try {
      // Add a small delay to ensure AsyncStorage is initialized
      await new Promise((resolve) => setTimeout(resolve, 100));
      this.userId = await AsyncStorage.getItem(NOTIFICATION_CONFIG.STORAGE_KEYS.USER_ID);
    } catch (error: any) {
      // Silently handle errors - userId can be set later
      // Check if it's a TypeError about AsyncStorage internals
      if (error?.message?.includes("Cannot read properties of undefined")) {
        console.debug("AsyncStorage not fully initialized yet");
        return;
      }
    }

    // Fallback for web if AsyncStorage failed
    if (this.userId === null && Platform.OS === "web") {
      try {
        // @ts-ignore
        this.userId = global.__userId || null;
      } catch {
        // Ignore fallback errors
      }
    }
  }

  async setUserId(userId: string): Promise<void> {
    this.userId = userId;
    try {
      if (!AsyncStorage) {
        // Fallback for web or if AsyncStorage not available
        if (Platform.OS === "web") {
          // @ts-ignore
          global.__userId = userId;
        }
        return;
      }

      await AsyncStorage.setItem(NOTIFICATION_CONFIG.STORAGE_KEYS.USER_ID, userId);
    } catch (error) {
      console.warn("Error setting user ID in AsyncStorage:", error);
      // Fallback for web
      if (Platform.OS === "web") {
        try {
          // @ts-ignore
          global.__userId = userId;
        } catch (fallbackError) {
          console.debug("Fallback user ID setting also failed:", fallbackError);
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
      await new Promise((resolve) => setTimeout(resolve, delay));
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

  /**
   * Check if a push token is already stored locally
   */
  async hasStoredPushToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(NOTIFICATION_CONFIG.STORAGE_KEYS.PUSH_TOKEN);
      return token !== null && token.length > 0;
    } catch (error) {
      console.error("Error checking stored push token:", error);
      return false;
    }
  }

  /**
   * Get the stored push token
   */
  async getStoredPushToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(NOTIFICATION_CONFIG.STORAGE_KEYS.PUSH_TOKEN);
    } catch (error) {
      console.error("Error getting stored push token:", error);
      return null;
    }
  }

  /**
   * Force re-registration of push token (useful for debugging or token refresh)
   */
  async forceTokenRefresh(): Promise<boolean> {
    try {
      console.log("Forcing token refresh...");
      
      // Clear stored token
      await AsyncStorage.removeItem(NOTIFICATION_CONFIG.STORAGE_KEYS.PUSH_TOKEN);
      
      // Request permissions and register new token
      return await this.requestPermissions();
    } catch (error) {
      console.error("Error forcing token refresh:", error);
      return false;
    }
  }

  /**
   * Initialize push notifications on app startup
   * Checks if token exists, if not requests permissions and registers token
   */
  async initializePushNotifications(): Promise<boolean> {
    try {
      console.log("Initializing push notifications...");

      // Check if we already have a stored token
      const hasToken = await this.hasStoredPushToken();
      
      if (hasToken) {
        console.log("Push token already registered, skipping initialization");
        return true;
      }

      console.log("No push token found, requesting permissions and registering...");

      // Request permissions and register token
      const success = await this.requestPermissions();
      
      if (success) {
        console.log("Push notifications initialized successfully");
      } else {
        console.warn("Failed to initialize push notifications");
      }

      return success;
    } catch (error) {
      console.error("Error initializing push notifications:", error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Notification permissions not granted");
        return false;
      }

      // Get push token
      const token = await this.getPushToken();
      if (token) {
        await this.registerPushToken(token);
      }

      return true;
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  }

  private async getPushToken(): Promise<string | null> {
    try {
      // Get projectId from app.json or environment
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn("No projectId found in app.json. Push notifications may not work properly.");
        console.warn("Please add projectId to app.json under extra.eas.projectId");
        // Try to get token without projectId (may work in some cases)
        const token = await Notifications.getExpoPushTokenAsync();
        return token.data;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      return token.data;
    } catch (error) {
      console.error("Error getting push token:", error);
      return null;
    }
  }

  private async registerPushToken(token: string): Promise<void> {
    try {
      console.log("Registering push token:", token);
      
      // Send token to backend
      const response = await fetch(`${this.baseUrl}/register-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userId: this.userId })
      });

      if (!response.ok) {
        throw new Error(`Failed to register token: ${response.status}`);
      }

      // Store token locally after successful registration
      await AsyncStorage.setItem(NOTIFICATION_CONFIG.STORAGE_KEYS.PUSH_TOKEN, token);
      console.log("Push token registered successfully");
    } catch (error) {
      console.error("Error registering push token:", error);
      throw error;
    }
  }

  async fetchNotifications(
    params: {
      page?: number;
      limit?: number;
      includeRead?: boolean;
      includeArchived?: boolean;
      type?: string;
      prioritizeTimeSensitive?: boolean;
    } = {}
  ): Promise<NotificationResponse> {
    // Build query params - only add userId if it's set
    const queryParams = new URLSearchParams({
      ...(this.userId && { userId: this.userId }),
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
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  async fetchTimeSensitiveNotifications(
    params: {
      page?: number;
      limit?: number;
      includeRead?: boolean;
      includeArchived?: boolean;
    } = {}
  ): Promise<NotificationResponse> {
    // Build query params - only add userId if it's set
    const queryParams = new URLSearchParams({
      ...(this.userId && { userId: this.userId }),
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
      console.error("Error fetching time-sensitive notifications:", error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const url = this.userId 
        ? `${this.baseUrl}/unread-count?userId=${this.userId}`
        : `${this.baseUrl}/unread-count`;
      
      const response = await this.rateLimitedFetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.unreadCount || 0;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${notificationId}/read`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  async markAsUnread(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${notificationId}/unread`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error marking notification as unread:", error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const body: any = {};
      if (this.userId) {
        body.userId = this.userId;
      }
      
      const response = await fetch(`${this.baseUrl}/mark-all-read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      throw error;
    }
  }

  async archiveNotification(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${notificationId}/archive`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error archiving notification:", error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${notificationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  // Server-Sent Events for real-time updates
  startListeningForUpdates(
    onUpdate: (notification: NotificationData) => void,
    onReservationUpdate?: (reservation: any) => void
  ): void {
    // Allow SSE to work without userId (for public/anon connections)
    // If userId is not set, only use SSE, not polling fallback

    // Try SSE first, fallback to polling only if userId is set
    try {
      // Subscribe to notification and reservation events
      const eventTypes = [
        "notification_created",
        "notification_read",
        "reservation_created",
        "reservation_updated",
        "reservation_confirmed",
        "reservation_cancelled",
        "reservation_deleted",
      ];

      sseService.connect(
        this.userId,
        (data) => {
          // Handle notification events
          if (data.type === "notification_created") {
            const notification = data.data?.notification || data.data;
            onUpdate(notification);
            this.showLocalNotification(notification);
          } else if (data.type === "notification_read") {
            // Optionally handle notification read events
            console.log("Notification marked as read:", data.data);
          }

          // Handle reservation events if callback is provided
          if (onReservationUpdate) {
            if (data.type === "reservation_created") {
              console.log("New reservation created:", data.data?.reservation);
              onReservationUpdate({ type: "created", reservation: data.data?.reservation });
            } else if (data.type === "reservation_updated") {
              console.log("Reservation updated:", data.data?.reservation);
              onReservationUpdate({ type: "updated", reservation: data.data?.reservation });
            } else if (data.type === "reservation_confirmed") {
              console.log("Reservation confirmed:", data.data?.reservation);
              onReservationUpdate({ type: "confirmed", reservation: data.data?.reservation });
            } else if (data.type === "reservation_cancelled") {
              console.log("Reservation cancelled:", data.data?.reservation);
              onReservationUpdate({ type: "cancelled", reservation: data.data?.reservation });
            } else if (data.type === "reservation_deleted") {
              console.log("Reservation deleted:", data.data?.reservation);
              onReservationUpdate({ type: "deleted", reservation: data.data?.reservation });
            }
          }
        },
        (error) => {
          console.warn("SSE connection failed");
          // Only fall back to polling if userId is set
          if (this.userId) {
            console.warn("Falling back to polling for userId:", this.userId);
            this.startPollingForUpdates(onUpdate);
          } else {
            console.warn("Cannot fall back to polling without userId");
          }
        },
        eventTypes
      );
    } catch {
      console.warn("SSE not available");
      // Only fall back to polling if userId is set
      if (this.userId) {
        console.warn("Falling back to polling for userId:", this.userId);
        this.startPollingForUpdates(onUpdate);
      } else {
        console.warn("Cannot fall back to polling without userId");
      }
    }
  }

  private startPollingForUpdates(onUpdate: (notification: NotificationData) => void): void {
    if (this.isPolling) {
      return; // Prevent multiple polling instances
    }

    // Cannot poll without userId
    if (!this.userId) {
      console.warn("Cannot start polling: User ID not set");
      return;
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
          lastCheckTime = await AsyncStorage.getItem(
            NOTIFICATION_CONFIG.STORAGE_KEYS.LAST_NOTIFICATION_CHECK
          );
        } catch (error) {
          console.warn("Error getting last check time from AsyncStorage:", error);
        }

        const currentTime = new Date().toISOString();

        if (lastCheckTime) {
          const newNotifications = latestNotifications.filter(
            (notification) => new Date(notification.createdAt) > new Date(lastCheckTime!)
          );

          newNotifications.forEach((notification) => {
            onUpdate(notification);
            this.showLocalNotification(notification);
          });
        }

        try {
          await AsyncStorage.setItem(
            NOTIFICATION_CONFIG.STORAGE_KEYS.LAST_NOTIFICATION_CHECK,
            currentTime
          );
        } catch (error) {
          console.warn("Error setting last check time in AsyncStorage:", error);
        }
      } catch (error) {
        console.error("Error polling for updates:", error);
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
      console.error("Error showing local notification:", error);
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

    console.log("Stopped listening for updates");
  }

  // Handle notification interactions
  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const notificationId = response.notification.request.content.data?.notificationId;

    if (notificationId && typeof notificationId === "string") {
      await this.markAsRead(notificationId);
    }
  }
}

export const notificationService = new NotificationService();
