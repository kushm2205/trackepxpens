import {createStackNavigator} from '@react-navigation/stack';
import {Image} from 'react-native';
import AddFriendExpense from '../Screens/AddFriendExpense';
import AddPersonalExpenseScreen from '../Screens/AddPersonExpenss';
import ChatScreen from '../Screens/chatscreengroup';
import CreateGroup from '../Screens/CreateGroup';
import EditFriendExpenss from '../Screens/editfriendexpenss';
import EditExpenseScreen from '../Screens/EditGroupexpenss';
import ExpenseeScreen from '../Screens/ExpenseeScreen';
import ChatScreenFriend from '../Screens/FriendChatScreen';
import FriendExpenseDetails from '../Screens/FriendExpenseDetails';
import FriendRequest from '../Screens/FriendRequest';
import GroupDetailsScreen from '../Screens/GroupDetailsScreen';
import Home from '../Screens/Home';
import PersonalExpensesScreen from '../Screens/Personalexpenss';
import PieChartScreen from '../Screens/Piechart';
import PiChartFriend from '../Screens/PieChartFriend';
import {RootStackParamList} from '../types/types';
import {NavigationContainer} from '@react-navigation/native';

const Stack = createStackNavigator<RootStackParamList>();
export const AppStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Home"
      component={Home}
      options={{
        headerTitle: () => (
          <Image
            source={require('../assets/pocket3.png')}
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
