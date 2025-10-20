// Notification configuration
export const NOTIFICATION_CONFIG = {
  // API Configuration
  API_BASE_URL: "https://sundate.justdemo.work/api",
  
  // Polling Configuration
  POLLING_INTERVAL: 60000, // 60 seconds - increased to reduce server load
  
  // Notification Types
  NOTIFICATION_TYPES: {
    RESERVATION_CREATED: 'reservation_created',
    RESERVATION_CONFIRMED: 'reservation_confirmed',
    RESERVATION_CANCELLED: 'reservation_cancelled',
    RESERVATION_UPDATED: 'reservation_updated',
    RESERVATION_REMINDER: 'reservation_reminder',
    SYSTEM: 'system',
    PROMOTIONAL: 'promotional',
  } as const,
  
  // Priority Levels
  PRIORITY_LEVELS: {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
  } as const,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Storage Keys
  STORAGE_KEYS: {
    USER_ID: 'userId',
    LAST_NOTIFICATION_CHECK: 'lastNotificationCheck',
    NOTIFICATION_SETTINGS: 'notificationSettings',
  },
  
  // Notification Settings
  DEFAULT_SETTINGS: {
    enablePushNotifications: true,
    enableSound: true,
    enableVibration: true,
    enableBadge: true,
    pollingEnabled: true,
  },
};

// Type definitions for better TypeScript support
export type NotificationType = typeof NOTIFICATION_CONFIG.NOTIFICATION_TYPES[keyof typeof NOTIFICATION_CONFIG.NOTIFICATION_TYPES];
export type PriorityLevel = typeof NOTIFICATION_CONFIG.PRIORITY_LEVELS[keyof typeof NOTIFICATION_CONFIG.PRIORITY_LEVELS];
