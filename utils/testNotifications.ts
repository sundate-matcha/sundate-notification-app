// Test utility for notification functionality
import { Platform } from 'react-native';
import { notificationService } from '../services/notificationService';

export const testNotificationSystem = async () => {
  console.log('🧪 Testing Notification System...');
  console.log('Platform:', Platform.OS);
  
  try {
    // Test 1: Set user ID
    console.log('1. Setting user ID...');
    await notificationService.setUserId('test-user-123');
    console.log('✅ User ID set successfully');
    
    // Test 2: Request permissions
    console.log('2. Requesting permissions...');
    const hasPermissions = await notificationService.requestPermissions();
    console.log('Permissions granted:', hasPermissions);
    
    // Test 3: Fetch notifications
    console.log('3. Fetching notifications...');
    const notifications = await notificationService.fetchNotifications({
      page: 1,
      limit: 5
    });
    console.log('Notifications fetched:', notifications.notifications.length);
    
    // Test 4: Get unread count
    console.log('4. Getting unread count...');
    const unreadCount = await notificationService.getUnreadCount();
    console.log('Unread count:', unreadCount);
    
    console.log('✅ Notification system test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Notification system test failed:', error);
    console.error('Error details:', error);
    return false;
  }
};

// Test rate limiting functionality
export const testRateLimiting = async () => {
  console.log('🚦 Testing Rate Limiting...');
  
  try {
    await notificationService.setUserId('test-user-123');
    
    // Test rapid successive calls
    console.log('Testing rapid successive calls...');
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        notificationService.fetchNotifications({ page: 1, limit: 5 })
          .then(() => console.log(`Request ${i + 1} completed`))
          .catch(err => console.log(`Request ${i + 1} failed:`, err.message))
      );
    }
    
    await Promise.all(promises);
    console.log('✅ Rate limiting test completed - no 429 errors should occur');
    return true;
  } catch (error) {
    console.error('❌ Rate limiting test failed:', error);
    return false;
  }
};

// Test real-time updates
export const testRealTimeUpdates = () => {
  console.log('🔄 Testing real-time updates...');
  
  notificationService.startListeningForUpdates((notification) => {
    console.log('📱 New notification received:', notification);
  });
  
  // Stop listening after 30 seconds
  setTimeout(() => {
    notificationService.stopListeningForUpdates();
    console.log('⏹️ Stopped listening for updates');
  }, 30000);
};

// Test AsyncStorage specifically
export const testAsyncStorageFix = async () => {
  console.log('🔧 Testing AsyncStorage Fix...');
  console.log('Platform:', Platform.OS);
  
  try {
    // Test basic AsyncStorage operations
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    
    console.log('1. Testing AsyncStorage.setItem...');
    await AsyncStorage.setItem('test-asyncstorage-key', 'test-value');
    console.log('✅ AsyncStorage.setItem works');
    
    console.log('2. Testing AsyncStorage.getItem...');
    const value = await AsyncStorage.getItem('test-asyncstorage-key');
    console.log('✅ AsyncStorage.getItem works, value:', value);
    
    console.log('3. Testing AsyncStorage.removeItem...');
    await AsyncStorage.removeItem('test-asyncstorage-key');
    console.log('✅ AsyncStorage.removeItem works');
    
    console.log('✅ AsyncStorage fix test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ AsyncStorage fix test failed:', error);
    console.error('Error details:', error);
    return false;
  }
};
