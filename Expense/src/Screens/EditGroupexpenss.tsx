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
  Modal,
  FlatList,
} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../Redux/store';
import {useRoute, useNavigation} from '@react-navigation/native';
import {doc, getDoc, updateDoc, deleteDoc} from 'firebase/firestore';
import {db} from '../services/firestore';

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
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  const handleMemberSelect = (memberId: string) => {
    setPaidBy(memberId);
    setModalVisible(false);
  };

  const renderModalItem = ({item}: {item: string}) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleMemberSelect(item)}>
      <Text style={styles.modalItemText}>{memberNames[item] || item}</Text>
    </TouchableOpacity>
  );

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
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.pickerButtonText}>
            {paidBy ? memberNames[paidBy] || paidBy : 'Select member'}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Member</Text>
              <FlatList
                data={groupMembers}
                renderItem={renderModalItem}
                keyExtractor={item => item}
                style={styles.modalList}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
    color: '#29846A',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#4CBB9B',
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  pickerButton: {
    backgroundColor: '#4CBB9B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  pickerButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
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
    backgroundColor: '#3fff',
    borderColor: '#3fff',
  },
  memberName: {
    fontSize: 16,
    color: 'black',
  },
  selectedMemberText: {
    color: 'black',
  },
  checkmark: {
    color: '#29846A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateButton: {
    backgroundColor: '#4CBB9B',
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
    borderColor: '#4CBB9B',
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

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#29846A',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#29846A',
    fontWeight: '500',
  },
});

export default EditExpenseScreen;
