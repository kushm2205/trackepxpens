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

type AddExpenseScreenRouteProp = RouteProp<RootStackParamList, 'AddExpense'>;
type AddExpenseScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AddExpense'
>;

const AddExpenseScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<AddExpenseScreenNavigationProp>();
  const route = useRoute<AddExpenseScreenRouteProp>();
  const {groupId} = route.params;
  const {selectedGroup, memberNames, loading, error} = useSelector(
    (state: RootState) => state.Group,
  );

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

  if (loading || !selectedGroup) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
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
    console.log('Tranc', splitBetween);
    try {
      await addExpense(
        groupId,
        paidBy,
        parseFloat(amount),
        splitBetween,
        description,
      );

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
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{selectedGroup.groupName}</Text>

      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />

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
        onPress={handleAddExpenseSubmit}>
        <Text style={styles.submitButtonText}>Add Expense</Text>
      </TouchableOpacity>

      <Modal visible={paidByModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
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
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={splitBetweenModalVisible}
        transparent
        animationType="slide">
        <View style={styles.modalContainer}>
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
            <Text>Close</Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#e0e0e0',
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: '50%',
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedModalItem: {
    backgroundColor: '#d0e8ff',
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: '#ccc',
    padding: 15,
    alignItems: 'center',
  },
});

export default AddExpenseScreen;
