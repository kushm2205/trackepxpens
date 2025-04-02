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

const Stack = createStackNavigator();

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
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {userId ? (
          <Stack.Screen name="Home" component={Home} />
        ) : (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Signup" component={Signup} />
          </>
        )}
      </Stack.Navigator>
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
