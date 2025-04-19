import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import FriendsScreen from './FriendsScreen';
import ActivityScreen from './ActivityScreen';
import AccountScreen from './AccountScreen';
import GroupScrren from './GroupScrren';
import PersonalExpensesScreen from './Personalexpenss';
const Tab = createBottomTabNavigator();

const Home: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({color, size}) => {
          let iconName = '';

          switch (route.name) {
            case 'Group':
              iconName = 'people-outline';
              break;
            case 'Friends':
              iconName = 'person-outline';
              break;
            case 'Personal':
              iconName = 'wallet-outline';
              break;
            case 'Activity':
              iconName = 'pulse-outline';
              break;
            case 'Account':
              iconName = 'person-circle-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'grey',
        tabBarInactiveTintColor: '#4CBB9B',
        headerShown: false,
      })}>
      <Tab.Screen name="Group" component={GroupScrren} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Personal" component={PersonalExpensesScreen} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

export default Home;
