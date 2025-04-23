// src/Redux/slice/notificationSlice.ts
import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';

// Define the shape of the notification object
interface Notification {
  title: string;
  body: string;
  [key: string]: any; // Allow additional fields
}

// Define the initial state shape
interface NotificationState {
  fcmToken: string | null;
  notifications: Notification[];
  loading: boolean;
  error: string | null | unknown;
}

const initialState: NotificationState = {
  fcmToken: null,
  notifications: [],
  loading: false,
  error: null,
};

// Thunk to initialize notifications and get FCM token
export const initializeNotifications = createAsyncThunk<
  {token: string}, // return type
  string, // argument type (userId)
  {rejectValue: string} // rejectWithValue type
>('notifications/initialize', async (userId, {rejectWithValue}) => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      return rejectWithValue('Permission not granted');
    }

    const token = await messaging().getToken();
    console.log('FCM Token:', token);

    if (userId && token) {
      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          fcmTokens: firestore.FieldValue.arrayUnion(token),
        });

      await AsyncStorage.setItem('fcmToken', token);
    }

    return {token};
  } catch (error: any) {
    console.error('Error initializing notifications:', error);
    return rejectWithValue(error?.message || 'An error occurred');
  }
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
    },
    clearNotifications: state => {
      state.notifications = [];
    },
    setFcmToken: (state, action: PayloadAction<string>) => {
      state.fcmToken = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(initializeNotifications.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        initializeNotifications.fulfilled,
        (state, action: PayloadAction<{token: string}>) => {
          state.loading = false;
          state.fcmToken = action.payload.token;
        },
      )
      .addCase(initializeNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to initialize notifications';
      });
  },
});

export const {addNotification, clearNotifications, setFcmToken} =
  notificationSlice.actions;

export default notificationSlice.reducer;
