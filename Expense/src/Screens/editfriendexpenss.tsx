import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {doc, updateDoc, deleteDoc} from 'firebase/firestore';
import {db} from '../services/firestore';
import {useSelector} from 'react-redux';
import {RootState} from '../Redux/store';
import {EditExpenseRouteProp} from '../types/types';

const EditFriendExpenss = () => {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {expense, friend, onUpdate} = route.params as EditExpenseRouteProp;
  const loggedInUserId = useSelector((state: RootState) => state.auth.userId);

  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [paidBy, setPaidBy] = useState(expense.paidBy);
  const [splitBetween, setSplitBetween] = useState(expense.splitBetween);

  const handleUpdate = async () => {
    try {
      const expenseRef = doc(db, 'friend_expenses', expense.id);
      await updateDoc(expenseRef, {
        description,
        amount: parseFloat(amount),
        paidBy,
        splitBetween,
      });
      onUpdate();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update expense');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'friend_expenses', expense.id));
      onUpdate();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete expense');
      console.error(error);
    }
  };

  const toggleUserInSplit = (userId: string) => {
    if (splitBetween.includes(userId)) {
      setSplitBetween(splitBetween.filter((id: string) => id !== userId));
    } else {
      setSplitBetween([...splitBetween, userId]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter description"
        />

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter amount"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Paid by</Text>
        <View style={styles.radioGroup}>
          <Pressable
            style={[
              styles.radioButton,
              paidBy === loggedInUserId && styles.radioButtonSelected,
            ]}
            onPress={() => setPaidBy(loggedInUserId)}>
            <Text
              style={[
                styles.radioButtonText,
                paidBy === loggedInUserId && styles.radioButtonTextSelected,
              ]}>
              You
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.radioButton,
              paidBy === friend.userId && styles.radioButtonSelected,
            ]}
            onPress={() => setPaidBy(friend.userId)}>
            <Text
              style={[
                styles.radioButtonText,
                paidBy === friend.userId && styles.radioButtonTextSelected,
              ]}>
              {friend.name}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Split between</Text>
        <View style={styles.checkboxGroup}>
          <Pressable
            style={[
              styles.checkbox,
              splitBetween.includes(loggedInUserId) && styles.checkboxSelected,
            ]}
            onPress={() => toggleUserInSplit(loggedInUserId)}>
            <Text
              style={[
                styles.checkboxText,
                splitBetween.includes(loggedInUserId) &&
                  styles.checkboxTextSelected,
              ]}>
              You
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.checkbox,
              splitBetween.includes(friend.userId) && styles.checkboxSelected,
            ]}
            onPress={() => toggleUserInSplit(friend.userId)}>
            <Text
              style={[
                styles.checkboxText,
                splitBetween.includes(friend.userId) &&
                  styles.checkboxTextSelected,
              ]}>
              {friend.name}
            </Text>
          </Pressable>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.buttonText}>Update Expense</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.buttonText}>Delete Expense</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  radioButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginRight: 10,
  },
  radioButtonSelected: {
    backgroundColor: 'blue',
    borderColor: 'blue',
  },
  radioButtonText: {
    fontSize: 16,
  },
  radioButtonTextSelected: {
    color: 'white',
  },
  checkboxGroup: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  checkbox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: 'blue',
    borderColor: 'blue',
  },
  checkboxText: {
    fontSize: 16,
  },
  checkboxTextSelected: {
    color: 'white',
  },
  buttonContainer: {
    marginTop: 20,
  },
  updateButton: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditFriendExpenss;
