import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {Friend} from '../types/types';
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '../Redux/store';
import {addFriendExpenseThunk} from '../Redux/slice/expnseSlice'; // Renamed import
import {RootStackParamList} from '../types/types';
import {getUser} from '../services/firestore';
import {LoggedInUser} from '../Redux/slice/authSlice';

type FriendExpenseDetailsRouteProp = RouteProp<
  RootStackParamList,
  'FriendExpenseDetails'
>;

const FriendExpenseDetails = () => {
  const route =
    useRoute<RouteProp<RootStackParamList, 'FriendExpenseDetails'>>();
  const {friend} = route.params;
  const navigation = useNavigation();

  const loggedInUser = useSelector(
    (state: RootState) => state.auth,
  ) as LoggedInUser;
  const dispatch = useDispatch<AppDispatch>();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [splitWithFriend, setSplitWithFriend] = useState(true);
  const [splitWithUser, setSplitWithUser] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [paidBySelection, setPaidBySelection] = useState<'user' | 'friend'>(
    'user',
  );
  useEffect(() => {
    const fetchUserName = async () => {
      const userData = await getUser(loggedInUser.userId || '');
      if (userData && userData.name) {
        setUserName(userData.name);
      }
    };
    fetchUserName();
    setPaidBySelection('user');
  }, [loggedInUser.userId]);
  const sendExpenseNotification = async (expenseData: any) => {
    try {
      const response = await fetch(
        'http://192.168.200.92:5000/send-expense-notification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payerId: loggedInUser.userId,
            friendId: friend.userId || friend.phone,
            expenseId: expenseData.id || new Date().getTime().toString(),
            description: description,
            amount: parseFloat(amount),
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to send notification:', errorData);
      } else {
        console.log('Notification sent successfully');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleAddExpense = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (!description) {
      Alert.alert(
        'Missing Description',
        'Please add a description for this expense',
      );
      return;
    }

    const paidBy =
      paidBySelection === 'user'
        ? loggedInUser.userId || ''
        : friend.userId || friend.phone || '';

    const splitBetween: string[] = [];
    if (splitWithFriend) {
      splitBetween.push(friend.userId || friend.phone || '');
    }
    if (splitWithUser) {
      splitBetween.push(loggedInUser.userId || '');
    }

    if (splitBetween.length === 0) {
      Alert.alert(
        'Invalid Split',
        'Please select at least one person to split with',
      );
      return;
    }

    try {
      const expenseData = {
        paidBy: paidBy,
        amount: parseFloat(amount),
        splitBetween,
        description,
        friendId: friend.userId || friend.phone || '',
      };

      await dispatch(addFriendExpenseThunk(expenseData));
      await sendExpenseNotification(expenseData);
      navigation.goBack();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.friendInfo}>
          <Image
            source={
              friend.photo
                ? {uri: friend.photo}
                : require('../assets/download.png')
            }
            style={styles.friendImage}
          />
          <Text style={styles.friendName}>{friend.name}</Text>
        </View>

        <Text style={styles.label}>Amount:</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0.00"
        />

        <Text style={styles.label}>Description:</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="What was this expense for?"
        />

        <Text style={styles.label}>Paid By:</Text>
        <View style={styles.paidByOptions}>
          <Pressable
            style={[
              styles.paidByOption,
              paidBySelection === 'user' && styles.selectedPaidByOption,
            ]}
            onPress={() => setPaidBySelection('user')}>
            <Text style={styles.paidByOptionText}>{userName || 'You'}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.paidByOption,
              paidBySelection === 'friend' && styles.selectedPaidByOption,
            ]}
            onPress={() => setPaidBySelection('friend')}>
            <Text style={styles.paidByOptionText}>{friend.name}</Text>
          </Pressable>
        </View>
        <Text style={styles.label}>Split Between:</Text>
        <View style={styles.splitOptions}>
          <Pressable
            style={[
              styles.splitOption,
              splitWithFriend && styles.selectedSplitOption,
            ]}
            onPress={() => setSplitWithFriend(!splitWithFriend)}>
            <Text style={styles.splitOptionText}>{friend.name}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.splitOption,
              splitWithUser && styles.selectedSplitOption,
            ]}
            onPress={() => setSplitWithUser(!splitWithUser)}>
            <Text style={styles.splitOptionText}>You</Text>
          </Pressable>
        </View>
        <Pressable style={styles.addButton} onPress={handleAddExpense}>
          <Text style={styles.addButtonText}>Add Expense</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FriendExpenseDetails;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  friendInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  friendImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  friendName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#29846A',
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    color: '#4BBC9B',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: 'grey',
    padding: 10,
    marginTop: 5,
    borderRadius: 5,
  },
  paidByText: {
    marginTop: 5,
    fontSize: 16,
  },
  splitOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  splitOption: {
    borderWidth: 1,
    borderColor: '#4BBC9B',
    padding: 10,
    borderRadius: 5,
  },
  selectedSplitOption: {
    backgroundColor: '#4BBC9B',
  },
  splitOptionText: {
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#4BBC9B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
  },
  paidByOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  paidByOption: {
    borderWidth: 1,
    borderColor: 'grey',
    padding: 10,
    borderRadius: 5,
  },
  selectedPaidByOption: {
    backgroundColor: '#4BBC9B',
  },
  paidByOptionText: {
    fontSize: 16,
  },
});
