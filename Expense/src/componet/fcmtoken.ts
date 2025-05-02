import messaging from '@react-native-firebase/messaging';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import firestore, {doc, updateDoc} from '@react-native-firebase/firestore';
import {ToastAndroid} from 'react-native';
export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Permission request failed:', err);
      return false;
    }
  } else if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }
  return false;
};

export const getAndSaveFCMToken = async (userId: string) => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permissions denied');
      return null;
    }

    const token = await messaging().getToken();
    console.log('FCM Token:', token);

    if (token && userId) {
      await firestore().collection('users').doc(userId).update({
        fcmToken: token,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    }

    return token;
  } catch (error) {
    console.error('Error with FCM token:', error);
    return null;
  }
};

export const setupForegroundNotifications = () => {
  return messaging().onMessage(async remoteMessage => {
    console.log('Foreground notification received:', remoteMessage);
    const title = remoteMessage.notification?.title || 'New Notification';
    const body = remoteMessage.notification?.body || '';
    ToastAndroid.show(`${title}: ${body}`, ToastAndroid.SHORT);
  });
};

export const setupBackgroundNotifications = () => {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background notification received:', remoteMessage);
  });
};

export const setupNotificationOpenedApp = () => {
  return messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification opened app:', remoteMessage);
  });
};

export const checkInitialNotification = async () => {
  const remoteMessage = await messaging().getInitialNotification();
  if (remoteMessage) {
    console.log('App opened from quit state via notification:', remoteMessage);
  }
};
