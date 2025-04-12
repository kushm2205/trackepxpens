import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../Redux/store';
import {useRoute, useNavigation} from '@react-navigation/native';
import {doc, getDoc, updateDoc, deleteDoc} from 'firebase/firestore';
import {db} from '../services/firestore';
import {Picker} from '@react-native-picker/picker';

const EditExpenseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {groupId, expenseId} = route.params;
  const {memberNames} = useSelector((state: RootState) => state.group);
  const {userId: currentUserId} = useSelector((state: RootState) => state.auth);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch expense data
        const expenseRef = doc(db, 'expenses', expenseId);
        const expenseSnap = await getDoc(expenseRef);

        if (!expenseSnap.exists()) {
          throw new Error('Expense not found');
        }

        const expenseData = expenseSnap.data();
        setDescription(expenseData.description);
        setAmount(expenseData.amount.toString());
        setPaidBy(expenseData.paidBy);
        setSplitBetween(expenseData.splitBetween);

        // Fetch group members
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);

        if (groupSnap.exists()) {
          setGroupMembers(groupSnap.data().members || []);
        } else {
          throw new Error('Group not found');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load expense data');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [expenseId, groupId, navigation]);

  const handleMemberToggle = (memberId: string) => {
    if (splitBetween.includes(memberId)) {
      setSplitBetween(splitBetween.filter(id => id !== memberId));
    } else {
      setSplitBetween([...splitBetween, memberId]);
    }
  };

  const handleUpdateExpense = async () => {
    if (!description || !amount || !paidBy || splitBetween.length === 0) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setUpdating(true);
    try {
      const expenseRef = doc(db, 'expenses', expenseId);
      await updateDoc(expenseRef, {
        description,
        amount: amountValue,
        paidBy,
        splitBetween,
      });
      Alert.alert('Success', 'Expense updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating expense:', error);
      Alert.alert('Error', 'Failed to update expense');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteExpense = async () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              const expenseRef = doc(db, 'expenses', expenseId);
              await deleteDoc(expenseRef);
              Alert.alert('Success', 'Expense deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'Failed to delete expense');
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.sectionTitle}>Edit Expense</Text>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="What was this expense for?"
        />

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Paid by</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={paidBy}
            onValueChange={itemValue => setPaidBy(itemValue)}>
            {groupMembers.map(memberId => (
              <Picker.Item
                key={memberId}
                label={memberNames[memberId] || memberId}
                value={memberId}
              />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Split between</Text>
        <View style={styles.membersContainer}>
          {groupMembers.map(memberId => (
            <TouchableOpacity
              key={memberId}
              style={[
                styles.memberItem,
                splitBetween.includes(memberId) && styles.selectedMember,
              ]}
              onPress={() => handleMemberToggle(memberId)}>
              <Text
                style={[
                  styles.memberName,
                  splitBetween.includes(memberId) && styles.selectedMemberText,
                ]}>
                {memberNames[memberId] || memberId}
              </Text>
              {splitBetween.includes(memberId) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdateExpense}
          disabled={updating}>
          {updating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Expense</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteExpense}
          disabled={updating}>
          <Text style={styles.deleteButtonText}>Delete Expense</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  membersContainer: {
    marginBottom: 24,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedMember: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  memberName: {
    fontSize: 16,
    color: '#333',
  },
  selectedMemberText: {
    color: '#fff',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditExpenseScreen;
