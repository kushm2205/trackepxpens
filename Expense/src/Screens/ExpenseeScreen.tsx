import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {calculateShares} from '../utils/Expenssutils';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '../Redux/store';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {
  addExpenseTransaction,
  fetchGroupDetails,
  fetchUserDetails,
} from '../Redux/slice/GroupSlice';
import {addExpense, db} from '../services/firestore';
import {RootStackParamList} from '../types/types';
import {addDoc, collection, serverTimestamp} from 'firebase/firestore';
import type {AppDispatch} from '../Redux/store';
type AddExpenseScreenRouteProp = RouteProp<RootStackParamList, 'AddExpense'>;
type AddExpenseScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AddExpense'
>;

const AddExpenseScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<AddExpenseScreenNavigationProp>();
  const route = useRoute<AddExpenseScreenRouteProp>();
  const {groupId} = route.params;
  const {selectedGroup, memberNames, loading, error} = useSelector(
    (state: RootState) => state.group,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [paidByModalVisible, setPaidByModalVisible] = useState(false);
  const [splitBetweenModalVisible, setSplitBetweenModalVisible] =
    useState(false);

  useEffect(() => {
    dispatch(fetchGroupDetails(groupId));
  }, [dispatch, groupId]);

  useEffect(() => {
    if (selectedGroup && selectedGroup.members) {
      selectedGroup.members.forEach((memberId: string) => {
        if (!memberNames[memberId]) {
          dispatch(fetchUserDetails(memberId));
        }
      });
    }
  }, [dispatch, selectedGroup, memberNames]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CBB9B" />
        <Text>Loading group data...</Text>
      </View>
    );
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }
  if (
    !selectedGroup ||
    !selectedGroup.members ||
    selectedGroup.members.length === 0
  ) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CBB9B" />
        <Text>No group data available or group has no members</Text>
      </View>
    );
  }
  const calculateBalances = () => {
    const amt = parseFloat(amount);
    const share = amt / splitBetween.length;
    const balances: {[key: string]: number} = {};

    splitBetween.forEach(user => {
      if (user !== paidBy) {
        balances[user] = (balances[user] || 0) - share;
        balances[paidBy!] = (balances[paidBy!] || 0) + share;
      }
    });

    return balances;
  };

  const handleAddExpenseSubmit = async () => {
    if (!paidBy || splitBetween.length === 0 || !amount || !description) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      await addExpense(
        groupId,
        paidBy,
        parseFloat(amount),
        splitBetween,
        description,
      );

      await sendExpenseNotification({
        payerId: paidBy,
        groupId,
        expenseId: '',
        description,
        amount: parseFloat(amount),
      });

      dispatch(
        addExpenseTransaction({
          groupId,
          paidBy,
          amount: parseFloat(amount),
          splitBetween,
        }),
      );

      navigation.goBack();
    } catch (err) {
      console.error('Error adding expense:', err);
      Alert.alert('Error', 'Failed to add expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendExpenseNotification = async (notificationData: {
    payerId: string;
    groupId: string;
    expenseId: string;
    description: string;
    amount: number;
  }) => {
    try {
      const response = await fetch(
        'http://192.168.200.92:5000/send-group-expense-notification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationData),
        },
      );

      if (!response.ok) {
        console.error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{selectedGroup.groupName}</Text>
      <Text style={styles.section}>Description </Text>
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <Text style={styles.section}>Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="INR Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => setPaidByModalVisible(true)}>
        <Text>Paid By: {paidBy ? memberNames[paidBy] : 'Select Member'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setSplitBetweenModalVisible(true)}>
        <Text>Split Between: {splitBetween.length} members selected</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleAddExpenseSubmit}
        disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Add Expense</Text>
        )}
      </TouchableOpacity>

      <Modal visible={paidByModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.text}>Select Member</Text>
          <FlatList
            data={selectedGroup.members}
            keyExtractor={item => item}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setPaidBy(item);
                  setPaidByModalVisible(false);
                }}>
                <Text>{memberNames[item]}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setPaidByModalVisible(false)}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={splitBetweenModalVisible}
        transparent
        animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.text}>Select Member</Text>
          <FlatList
            data={selectedGroup.members}
            keyExtractor={item => item}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  splitBetween.includes(item) && styles.selectedModalItem,
                ]}
                onPress={() => {
                  if (splitBetween.includes(item)) {
                    setSplitBetween(splitBetween.filter(id => id !== item));
                  } else {
                    setSplitBetween([...splitBetween, item]);
                  }
                  console.log('splitBetween--', splitBetween);
                }}>
                <Text>{memberNames[item]}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setSplitBetweenModalVisible(false)}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#29846A',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#29846A',
  },
  section: {
    marginBottom: 5,
    color: '#4CBB9B',
    fontSize: 16,
  },
  input: {
    borderWidth: 2,
    backgroundColor: '#ffff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4ABB9B',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#4CBB9B',
    padding: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    backgroundColor: '#fff',
    flex: 1,
    borderRadius: 15,
    padding: 20,
    marginTop: '97%',
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
  },
  selectedModalItem: {
    backgroundColor: '#3ff',
    opacity: 0.8,
    borderRadius: 10,
    marginBottom: 5,
  },
  modalCloseText: {
    color: 'grey',
    fontWeight: 700,
  },
  modalCloseButton: {
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: '5%',
    borderWidth: 1,
    borderColor: '#33FFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddExpenseScreen;
