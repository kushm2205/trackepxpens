import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {StyleSheet, View, TouchableOpacity} from 'react-native';

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
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0,
          elevation: 1,
          width: '99%',
          alignSelf: 'center',
          borderRadius: 15,
        },
      })}>
      <Tab.Screen name="Group" component={GroupScrren} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen
        name="Personal"
        component={PersonalExpensesScreen}
        options={{
          tabBarButton: props => (
            <View style={styles.personalTabContainer}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.personalTabButton}
                onPress={props.onPress}>
                <Ionicons name="wallet-outline" size={28} color="white" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  personalTabContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    top: -15,
  },
  personalTabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CBB9B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default Home;
