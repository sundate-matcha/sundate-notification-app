# SSE Usage Guide - React Native/Expo App

This guide explains how to use the Server-Sent Events (SSE) implementation in the Sundate Notification App.

---

## 🎯 Overview

The app now uses the new API Gateway SSE implementation for real-time updates. Key features:

- **Real-time Notifications**: Instant delivery of notification events
- **Reservation Updates**: Live updates for reservation changes
- **Automatic Reconnection**: Handles connection drops gracefully
- **Fallback Polling**: Automatically switches to polling if SSE fails
- **Type Safety**: Full TypeScript support

---

## 🔌 Connection Endpoint

The app connects to: `https://sundate.justdemo.work/api/events`

---

## 📡 Event Types

### Reservation Events
- `reservation_created` - New reservation created
- `reservation_updated` - Reservation modified
- `reservation_confirmed` - Reservation confirmed
- `reservation_cancelled` - Reservation cancelled
- `reservation_deleted` - Reservation deleted

### Notification Events
- `notification_created` - New notification created
- `notification_read` - Notification marked as read

### System Events
- `system_status` - System status updates
- `connection_established` - SSE connection established
- `ping` - Keep-alive ping

---

## 🚀 Basic Usage

### 1. Using NotificationService (Recommended)

The simplest way to use SSE is through the `notificationService`:

```typescript
import { notificationService } from '../services/notificationService';

// Start listening for updates
notificationService.startListeningForUpdates(
  (notification) => {
    // Handle new notifications
    console.log('New notification:', notification);
  },
  (reservationUpdate) => {
    // Handle reservation updates (optional)
    console.log('Reservation update:', reservationUpdate);
  }
);

// Stop listening when done
notificationService.stopListeningForUpdates();
```

### 2. Using SSEService Directly

For more control, use `sseService` directly:

```typescript
import { sseService } from '../services/sseService';

// Connect to SSE stream
sseService.connect(
  'user-123', // userId (null for admin mode)
  (data) => {
    // Handle incoming events
    switch(data.type) {
      case 'notification_created':
        console.log('New notification:', data.data);
        break;
      case 'reservation_created':
        console.log('New reservation:', data.data);
        break;
      // ... handle other events
    }
  },
  (error) => {
    // Handle errors
    console.error('SSE error:', error);
  },
  ['notification_created', 'reservation_created'], // Event types filter (optional)
  'reservation-456' // Reservation ID filter (optional)
);

// Disconnect
sseService.disconnect();
```

---

## 🎯 React Hook Integration

The `useNotifications` hook automatically handles SSE connections:

```typescript
import { useNotifications } from '../hooks/useNotifications';

function NotificationScreen() {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    refreshNotifications,
  } = useNotifications('user-123');

  // SSE is automatically connected and disconnected
  // New notifications appear in real-time
  
  return (
    <View>
      {notifications.map(notification => (
        <NotificationItem key={notification.id} {...notification} />
      ))}
    </View>
  );
}
```

---

## 🔧 Configuration

All SSE settings are in `app/config/notification.config.ts`:

```typescript
export const NOTIFICATION_CONFIG = {
  API_BASE_URL: "https://sundate.justdemo.work/api",
  SSE_ENABLED: true,
  SSE_RECONNECT_INTERVAL: 5000, // 5 seconds
  SSE_MAX_RECONNECT_ATTEMPTS: 3,
  POLLING_INTERVAL: 60000, // Fallback polling: 60 seconds
  // ... more config
};
```

---

## 🎭 User Modes

### Regular User Mode
```typescript
// Connect as specific user - receives only their events
sseService.connect('user-123', handleMessage);
```

### Admin Mode
```typescript
// Connect as admin - receives all events for all admin users
sseService.connect(null, handleMessage);
```

---

## 📊 Event Data Structure

All events follow this structure:

```typescript
{
  type: 'reservation_created' | 'notification_created' | ...,
  data: {
    reservation?: { /* reservation object */ },
    notification?: { /* notification object */ },
    message?: string,
    // ... other data
  }
}
```

### Example Events

**Notification Created:**
```json
{
  "type": "notification_created",
  "data": {
    "notification": {
      "id": "notif-123",
      "title": "New Reservation",
      "body": "You have a new reservation request",
      "type": "reservation_created",
      "priority": "high",
      "isRead": false,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  }
}
```

**Reservation Updated:**
```json
{
  "type": "reservation_updated",
  "data": {
    "reservation": {
      "id": "res-456",
      "status": "confirmed",
      "customerName": "John Doe",
      "date": "2025-01-20",
      "time": "14:00"
    },
    "message": "Reservation confirmed"
  }
}
```

---

## 🔄 Connection Lifecycle

```
App Start
    ↓
Initialize NotificationService
    ↓
Set User ID
    ↓
Connect to SSE (/api/events?userId=xxx)
    ↓
[Success] → Receive Real-time Events
    ↓
[Error] → Fallback to Polling
    ↓
[Connection Lost] → Auto Reconnect (3 attempts)
    ↓
App Close → Disconnect SSE
```

---

## 🛡️ Error Handling

### Automatic Fallback
If SSE fails, the app automatically falls back to polling:

```typescript
// This is handled automatically in notificationService
notificationService.startListeningForUpdates(onUpdate);
// → Tries SSE first
// → Falls back to polling if SSE fails
```

### Manual Error Handling
```typescript
sseService.connect(
  userId,
  handleMessage,
  (error) => {
    // Custom error handling
    console.error('SSE failed:', error);
    
    // Could show user notification
    Alert.alert(
      'Connection Issue',
      'Using fallback mode. Some updates may be delayed.'
    );
  }
);
```

---

## 📱 React Native Considerations

### Platform Support
- ✅ **iOS**: Full SSE support
- ✅ **Android**: Full SSE support
- ✅ **Web**: Full SSE support

### Background Mode
SSE connections are maintained while the app is in foreground. When backgrounded:
- Connection may be suspended (OS dependent)
- Use Push Notifications for background delivery
- SSE reconnects automatically when app returns to foreground

### Network Changes
- SSE automatically handles network changes
- Reconnects when network is restored
- Falls back to polling if SSE repeatedly fails

---

## 🧪 Testing SSE

### Test Connection Status
```typescript
const isConnected = sseService.getConnectionStatus();
console.log('SSE Connected:', isConnected);
```

### Test with Specific Event Types
```typescript
// Only listen for reservation events
sseService.connect(
  userId,
  handleMessage,
  handleError,
  ['reservation_created', 'reservation_updated']
);
```

### Test with Specific Reservation
```typescript
// Only listen for events related to one reservation
sseService.connect(
  userId,
  handleMessage,
  handleError,
  undefined,
  'reservation-456'
);
```

---

## 🔍 Debugging

### Enable Debug Logging
```typescript
// In sseService.ts, console.debug statements show:
// - Connection status
// - Incoming events
// - Reconnection attempts
// - Ping events
```

### Check Connection
```typescript
// Log all incoming events
sseService.connect(userId, (data) => {
  console.log('SSE Event:', JSON.stringify(data, null, 2));
});
```

### Monitor Reconnections
Watch the console for:
```
SSE connection opened
SSE connection error: [error details]
Attempting to reconnect (1/3)...
Max reconnection attempts reached
```

---

## 🎬 Complete Example

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Alert } from 'react-native';
import { notificationService } from '../services/notificationService';
import { sseService } from '../services/sseService';

function MyNotificationScreen() {
  const [notifications, setNotifications] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    // Set user ID
    notificationService.setUserId('user-123');

    // Start listening for updates
    notificationService.startListeningForUpdates(
      (notification) => {
        // Add new notification to list
        setNotifications(prev => [notification, ...prev]);
        
        // Show alert for high priority
        if (notification.priority === 'high' || notification.priority === 'urgent') {
          Alert.alert(
            notification.title,
            notification.body
          );
        }
      },
      (reservationUpdate) => {
        // Handle reservation updates
        console.log('Reservation update:', reservationUpdate);
        
        if (reservationUpdate.type === 'confirmed') {
          Alert.alert(
            'Reservation Confirmed',
            'Your reservation has been confirmed!'
          );
        }
      }
    );

    // Monitor connection status
    const statusInterval = setInterval(() => {
      const connected = sseService.getConnectionStatus();
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    }, 2000);

    // Cleanup
    return () => {
      notificationService.stopListeningForUpdates();
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <View>
      <Text>Connection: {connectionStatus}</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.title}</Text>
            <Text>{item.body}</Text>
          </View>
        )}
      />
    </View>
  );
}

export default MyNotificationScreen;
```

---

## 📚 Related Files

- `app/services/sseService.ts` - Core SSE implementation
- `app/services/notificationService.ts` - High-level notification service
- `app/hooks/useNotifications.ts` - React hook for notifications
- `app/config/notification.config.ts` - Configuration settings
- `.helper-files/SSE_IMPLEMENTATION.md` - API Gateway SSE documentation

---

## 🆘 Troubleshooting

### Issue: Events Not Received
1. Check connection status: `sseService.getConnectionStatus()`
2. Verify userId is set correctly
3. Check network connectivity
4. Look for errors in console

### Issue: Frequent Disconnections
1. Check network stability
2. Adjust `SSE_RECONNECT_INTERVAL` in config
3. Consider increasing `SSE_MAX_RECONNECT_ATTEMPTS`

### Issue: Duplicate Notifications
1. Ensure `stopListeningForUpdates()` is called in cleanup
2. Check for multiple SSE connections
3. Verify React component useEffect dependencies

---

## 🚀 Performance Tips

1. **Filter Events**: Use event type filters to reduce data transfer
2. **Specific Reservations**: Monitor only relevant reservations
3. **Cleanup**: Always disconnect SSE when component unmounts
4. **Debouncing**: Use debouncing for rapid notification updates

---

This implementation provides a robust, real-time notification system that seamlessly integrates with your existing push notification infrastructure!


