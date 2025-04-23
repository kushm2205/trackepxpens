import React, {useEffect} from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {useSelector, useDispatch, Provider} from 'react-redux';
import {loadAuthState} from './src/Redux/slice/authSlice';
import {RootState, AppDispatch, store} from './src/Redux/store';
import Login from './src/Screens/Login';
import Signup from './src/Screens/Signup';
import Home from './src/Screens/Home';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GroupScreen from './src/Screens/GroupScrren';
import CreateGroup from './src/Screens/CreateGroup';
import FriendRequest from './src/Screens/FriendRequest';
import {RootStackParamList} from './src/types/types';
import GroupDetailsScreen from './src/Screens/GroupDetailsScreen';
import ExpenseeScreen from './src/Screens/ExpenseeScreen';
import AddFriendExpense from './src/Screens/AddFriendExpense';
import FriendExpenseDetails from './src/Screens/FriendExpenseDetails';
import FriendsScreen from './src/Screens/FriendsScreen';
import EditExpenseScreen from './src/Screens/EditGroupexpenss';
import EditFriendExpenss from './src/Screens/editfriendexpenss';
import AddPersonalExpenseScreen from './src/Screens/AddPersonExpenss';
import PersonalExpensesScreen from './src/Screens/Personalexpenss';
import PieChartScreen from './src/Screens/Piechart';
import PiChartFriend from './src/Screens/PieChartFriend';
import ChatScreen from './src/Screens/chatscreengroup';
import ChatScreenFriend from './src/Screens/FriendChatScreen';
import ActivityScreen from './src/Screens/ActivityScreen';
import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';
import firestore, {doc, updateDoc} from '@react-native-firebase/firestore';
import {db} from './src/services/firebase';
const Stack = createStackNavigator<RootStackParamList>();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen
      name="Login"
      component={Login}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="Signup"
      component={Signup}
      options={{headerShown: false}}
    />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Home"
      component={Home}
      options={{
        headerTitle: () => (
          <Image
            source={require('./src/assets/pocket3.png')}
            style={{width: 180, height: 220, resizeMode: 'contain'}}
          />
        ),
      }}
    />
    {/* <Stack.Screen name="GroupScreen" component={GroupScreen} /> */}
    <Stack.Screen name="AddExpense" component={ExpenseeScreen} />
    <Stack.Screen name="CreateGroup" component={CreateGroup} />
    {/* <Stack.Screen name="FriendsScreen" component={FriendsScreen} /> */}
    <Stack.Screen name="AddFriendExpense" component={AddFriendExpense} />
    <Stack.Screen name="FriendRequest" component={FriendRequest} />
    <Stack.Screen name="GroupDetailsScreen" component={GroupDetailsScreen} />
    <Stack.Screen name="EditExpense" component={EditExpenseScreen} />

    <Stack.Screen
      name="GroupChatScreen"
      component={ChatScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen name="EditFriendExpenss" component={EditFriendExpenss} />
    <Stack.Screen
      name="ChatScreenFriend"
      component={ChatScreenFriend}
      options={{title: 'Chat', headerShown: false}}
    />
    <Stack.Screen
      name="FriendExpenseDetails"
      component={FriendExpenseDetails}
    />
    <Stack.Screen
      name="AddPersonalExpense"
      component={AddPersonalExpenseScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="PersonalExpensesScreen"
      component={PersonalExpensesScreen}
    />
    <Stack.Screen name="PieChart" component={PieChartScreen} />

    <Stack.Screen name="PiChartFriend" component={PiChartFriend} />
  </Stack.Navigator>
);

const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {userId, loading} = useSelector((state: RootState) => state.auth);
  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }
  };

  const getAndSaveFCMToken = async (userId: string) => {
    try {
      await requestNotificationPermission();
      const token = await messaging().getToken();
      console.log('FCM Token:', token);

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: token,
        updatedAt: new Date().toISOString(),
      });

      return token;
    } catch (error) {
      console.error('Error with FCM token:', error);
      throw error;
    }
  };

  const setupForegroundNotifications = () => {
    return messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification:', remoteMessage);
      Alert.alert(
        remoteMessage.notification?.title || 'Notification',
        remoteMessage.notification?.body,
      );
    });
  };

  const setupBackgroundNotifications = () => {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background notification:', remoteMessage);
    });
  };

  useEffect(() => {
    dispatch(loadAuthState());
    const unsubscribeForeground = setupForegroundNotifications();
    setupBackgroundNotifications();

    return () => {
      unsubscribeForeground();
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

const App: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
});

export default App;
