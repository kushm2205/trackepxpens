import React, {useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {useSelector, useDispatch} from 'react-redux';
import {loadAuthState} from '../Redux/slice/authSlice';
import {RootState, AppDispatch} from '../Redux//store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RootStackParamList} from '../types/types';
import {db} from '../services/firebase';
import {
  setupForegroundNotifications,
  setupBackgroundNotifications,
  setupNotificationOpenedApp,
  checkInitialNotification,
  getAndSaveFCMToken,
} from '../componet/fcmtoken';
import {AppStack} from './Appstack';
import {AuthStack} from './authstack';
const Stack = createStackNavigator<RootStackParamList>();

const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {userId, loading} = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(loadAuthState());

    const unsubscribeForeground = setupForegroundNotifications();
    setupBackgroundNotifications();
    const unsubscribeOpenedApp = setupNotificationOpenedApp();
    checkInitialNotification();

    return () => {
      unsubscribeForeground();
      unsubscribeOpenedApp && unsubscribeOpenedApp();
    };
  }, [dispatch]);

  useEffect(() => {
    if (userId) {
      getAndSaveFCMToken(userId);
    }
  }, [userId]);
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {userId ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default AppContent;
