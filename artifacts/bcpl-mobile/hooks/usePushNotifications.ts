import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/context/AuthContext';
import { registerPushToken } from '@/lib/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { token, user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [permissionStatus, setPermissionStatus] = useState<any>(null);

  useEffect(() => {
    if (!token || !user) return; // only post-login

    async function registerForPushNotificationsAsync() {
      if (Platform.OS === 'web') return;
      try {
        const existingStatus = await Notifications.getPermissionsAsync() as any;
        let finalStatus = existingStatus.status || existingStatus.granted ? 'granted' : 'denied';

        if (finalStatus !== 'granted') {
          // You could show a soft prompt here first before calling requestPermissionsAsync
          const status = await Notifications.requestPermissionsAsync() as any;
          finalStatus = status.status || status.granted ? 'granted' : 'denied';
        }

        setPermissionStatus(finalStatus);

        if (finalStatus !== 'granted') {
          return;
        }

        // On Android, we need to set up a channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

        const projectId = 'your-project-id'; // Can be retrieved from Constants.expoConfig.extra.eas.projectId if defined.
        // Or simply call getExpoPushTokenAsync()
        const pushToken = await Notifications.getExpoPushTokenAsync().catch(e => {
          console.log('Failed to get expo push token', e);
          return null;
        });

        if (pushToken && pushToken.data) {
          setExpoPushToken(pushToken.data);
          import('@react-native-async-storage/async-storage').then(module => {
            module.default.setItem('bcpl-push-token', pushToken.data);
          });
          await registerPushToken(pushToken.data, Platform.OS).catch(e => console.log('Failed to register push token API', e));
        }
      } catch (e) {
        console.log('Push error:', e);
      }
    }

    registerForPushNotificationsAsync();
  }, [token, user]);

  return { expoPushToken, permissionStatus };
}
