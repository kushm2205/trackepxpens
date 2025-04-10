import React, {useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
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

// Define the root stack parameter list

const Stack = createStackNavigator<RootStackParamList>();

// Auth stack - for screens when user is NOT logged in
const AuthStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Login" component={Login} />
    <Stack.Screen name="Signup" component={Signup} />
  </Stack.Navigator>
);

// App stack - for screens when user IS logged in
const AppStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Home" component={Home} />
    <Stack.Screen name="GroupScreen" component={GroupScreen} />
    <Stack.Screen name="AddExpense" component={ExpenseeScreen} />
    <Stack.Screen name="CreateGroup" component={CreateGroup} />
    <Stack.Screen name="FriendsScreen" component={FriendsScreen} />
    <Stack.Screen name="AddFriendExpense" component={AddFriendExpense} />
    <Stack.Screen name="FriendRequest" component={FriendRequest} />
    <Stack.Screen name="GroupDetailsScreen" component={GroupDetailsScreen} />

    <Stack.Screen
      name="FriendExpenseDetails"
      component={FriendExpenseDetails}
    />
  </Stack.Navigator>
);

const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {userId, loading} = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(loadAuthState());
  }, [dispatch]);

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
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
