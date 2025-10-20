import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NotificationData, NotificationResponse, notificationService } from '../services/notificationService';

export interface UseNotificationsReturn {
  notifications: NotificationData[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  hasMore: boolean;
  currentPage: number;
  refreshNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  filterByType: (type: string | null) => void;
  currentFilter: string | null;
}

export function useNotifications(initialUserId?: string): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  
  // Refs to prevent duplicate requests
  const loadingRef = useRef(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoadParamsRef = useRef<string>('');

  const loadNotifications = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!initialUserId) return;

    // Create a unique key for this request
    const requestKey = `${page}-${append}-${currentFilter}`;
    
    // Prevent duplicate requests
    if (loadingRef.current || lastLoadParamsRef.current === requestKey) {
      return;
    }

    loadingRef.current = true;
    lastLoadParamsRef.current = requestKey;
    setLoading(true);
    setError(null);

    try {
      const response: NotificationResponse = await notificationService.fetchNotifications({
        page,
        limit: 20,
        includeRead: true,
        includeArchived: false,
        type: currentFilter || undefined,
        prioritizeTimeSensitive: true,
      });

      if (append) {
        setNotifications(prev => [...prev, ...response.notifications]);
      } else {
        setNotifications(response.notifications);
      }

      setHasMore(page < response.pagination.totalPages);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [initialUserId, currentFilter]);

  const loadUnreadCount = useCallback(async () => {
    if (!initialUserId) return;

    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }, [initialUserId]);

  const refreshNotifications = useCallback(async () => {
    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the refresh to prevent rapid successive calls
    debounceTimeoutRef.current = setTimeout(async () => {
      setCurrentPage(1);
      await loadNotifications(1, false);
      await loadUnreadCount();
    }, 300); // 300ms debounce
  }, [loadNotifications, loadUnreadCount]);

  const loadMoreNotifications = useCallback(async () => {
    if (!loading && hasMore) {
      await loadNotifications(currentPage + 1, true);
    }
  }, [loadNotifications, loading, hasMore, currentPage]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  }, []);

  const markAsUnread = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsUnread(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: false }
            : notification
        )
      );
      setUnreadCount(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as unread');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  }, []);

  const archiveNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.archiveNotification(notificationId);
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive notification');
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  }, []);

  const filterByType = useCallback((type: string | null) => {
    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce filter changes
    debounceTimeoutRef.current = setTimeout(() => {
      setCurrentFilter(type);
      setCurrentPage(1);
    }, 200); // 200ms debounce for filter changes
  }, []);

  // Initialize notifications and permissions
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!initialUserId) return;

      // Set user ID in service
      await notificationService.setUserId(initialUserId);

      // Request notification permissions
      await notificationService.requestPermissions();

      // Load initial data
      await refreshNotifications();
    };

    initializeNotifications();
  }, [initialUserId, refreshNotifications]);

  // Set up real-time updates
  useEffect(() => {
    if (!initialUserId) return;

    const handleNewNotification = (notification: NotificationData) => {
      setNotifications(prev => [notification, ...prev]);
      if (!notification.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    };

    // Start listening for updates
    notificationService.startListeningForUpdates(handleNewNotification);

    // Set up notification response handler
    const subscription = Notifications.addNotificationResponseReceivedListener(
      notificationService.handleNotificationResponse.bind(notificationService)
    );

    return () => {
      notificationService.stopListeningForUpdates();
      subscription.remove();
    };
  }, [initialUserId]);

  // Reload when filter changes
  useEffect(() => {
    if (initialUserId && currentFilter !== null) {
      // Only load if we have a valid filter and user ID
      loadNotifications(1, false);
    }
  }, [currentFilter, loadNotifications, initialUserId]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    hasMore,
    currentPage,
    refreshNotifications,
    loadMoreNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    filterByType,
    currentFilter,
  };
}
