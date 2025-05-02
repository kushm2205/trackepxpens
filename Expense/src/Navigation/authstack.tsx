import {createStackNavigator} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import Login from '../Screens/Login';
import Signup from '../Screens/Signup';

const Stack = createStackNavigator<RootStackParamList>();
export const AuthStack = () => (
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
