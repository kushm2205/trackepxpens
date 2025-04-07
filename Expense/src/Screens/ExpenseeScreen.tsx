// AddExpenseScreen.tsx
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
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '../Redux/store';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {fetchGroupDetails, fetchUserDetails} from '../Redux/slice/GroupSlice';
import {addExpense} from '../services/firestore';
import {RootStackParamList} from '../types/types';

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

  const handlePaidBySelection = (memberId: string) => {
    setPaidBy(memberId);
    setPaidByModalVisible(false);
  };

  const handleSplitBetweenSelection = (memberId: string) => {
    if (splitBetween.includes(memberId)) {
      setSplitBetween(splitBetween.filter(id => id !== memberId));
    } else {
      setSplitBetween([...splitBetween, memberId]);
    }
  };

  const handleAddExpenseSubmit = async () => {
    if (!paidBy || splitBetween.length === 0 || !amount || !description) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    try {
      await addExpense(
        groupId,
        paidBy,
        parseFloat(amount),
        splitBetween,
        description,
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
                onPress={() => handlePaidBySelection(item)}>
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
                onPress={() => handleSplitBetweenSelection(item)}>
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
