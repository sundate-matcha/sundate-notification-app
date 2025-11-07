import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { notificationService } from "../services/notificationService";

// Polyfill AsyncStorage for web
if (Platform.OS === "web") {
  // Ensure window object exists
  if (typeof window === "undefined") {
    // @ts-ignore
    global.window = global.window || {};
  }

  // Polyfill localStorage for AsyncStorage
  if (typeof localStorage === "undefined") {
    // @ts-ignore
    global.localStorage = {
      getItem: (key: string) => null,
      setItem: (key: string, value: string) => {},
      removeItem: (key: string) => {},
      clear: () => {},
      length: 0,
      key: (index: number) => null,
    };
  }

  // Ensure localStorage is available globally
  if (typeof global.localStorage === "undefined") {
    // @ts-ignore
    global.localStorage = global.localStorage ||
      window.localStorage || {
        getItem: (key: string) => null,
        setItem: (key: string, value: string) => {},
        removeItem: (key: string) => {},
        clear: () => {},
        length: 0,
        key: (index: number) => null,
      };
  }
}

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

export default function RootLayout() {
  useEffect(() => {
    // Request notification permissions on app startup
    // Push token will be registered after user logs in with their userId
    const initializeNotifications = async () => {
      try {
        // Skip on web platform
        if (Platform.OS !== "web") {
          await notificationService.requestPermissionsOnly();
          
          // Validate push token on startup if user is logged in
          try {
            await notificationService.validatePushTokenOnStartup();
          } catch (error) {
            console.error("Failed to validate push token on startup:", error);
          }
        }
      } catch (error) {
        console.error("Failed to request notification permissions:", error);
      }
    };

    initializeNotifications();

    // Set up notification response handler
    const subscription = Notifications.addNotificationResponseReceivedListener(
      notificationService.handleNotificationResponse.bind(notificationService)
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="screens/notificationScreen" options={{ headerShown: false }} />
      <Stack.Screen name="screens/reservationDateInfo" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
    </Stack>
  );
}
