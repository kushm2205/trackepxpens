import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {Friend, RootStackParamList} from '../types/types';
import {useSelector} from 'react-redux';
import {RootState} from '../Redux/store';
import {StackNavigationProp} from '@react-navigation/stack';
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  writeBatch,
} from 'firebase/firestore';
import {db} from '../services/firestore';
import {format} from 'date-fns';
import {FriendExpenseListRouteProp} from '../types/types'


const AddFriendExpense = () => {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {friend} = route.params as FriendExpenseListRouteProp;
  const loggedInUserId = useSelector((state: RootState) => state.auth.userId);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalOwed, setTotalOwed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loggedInUserId) return;

    const friendId = friend.userId || friend.phone;

    const expensesQuery = query(
      collection(db, 'friend_expenses'),
      where('splitBetween', 'array-contains', loggedInUserId),
      where('friendId', '==', friendId),
    );

    const unsubscribe = onSnapshot(
      expensesQuery,
      querySnapshot => {
        const fetchedExpenses = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
        setExpenses(fetchedExpenses);
        setLoading(false);
      },
      error => {
        console.error('Error fetching expenses:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [loggedInUserId, friend]);

  const handleExpensePress = (expense: any) => {
    navigation.navigate('EditFriendExpenss', {
      expense,
      friend,
      onUpdate: () => void {},
    });
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteDoc(doc(db, 'friend_expenses', expenseId));
      Alert.alert('Success', 'Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      Alert.alert('Error', 'Failed to delete expense. Please try again.');
    }
  };

  const handleSettleUp = async () => {
    if (expenses.length === 0) {
      Alert.alert('No expenses to settle');
      return;
    }

    Alert.alert(
      'Confirm Settlement',
      `Are you sure you want to clear all ${expenses.length} expenses with ${friend.name}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          onPress: async () => {
            try {
              const batch = writeBatch(db);

              expenses.forEach(expense => {
                const expenseRef = doc(db, 'friend_expenses', expense.id);
                batch.delete(expenseRef);
              });

              await batch.commit();

              Alert.alert('Success', 'All expenses have been cleared');
            } catch (error) {
              console.error('Error settling up:', error);
              Alert.alert('Error', 'Failed to settle up. Please try again.');
            }
          },
        },
      ],
    );
  };

  const renderExpenseItem = ({item}: {item: any}) => {
    const splitAmount = item.amount / item.splitBetween.length;
    const paidBy = item.paidBy === loggedInUserId ? 'You' : friend.name;
    const date = format(item.createdAt, 'MMM dd, yyyy');
    const isCurrentUserExpense = item.paidBy === loggedInUserId;

    return (
      <Pressable
        onPress={() => handleExpensePress(item)}
        onLongPress={() => {
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
                onPress: () => handleDeleteExpense(item.id),
                style: 'destructive',
              },
            ],
          );
        }}>
        <View
          style={[
            styles.expenseItem,
            isCurrentUserExpense && styles.highlightedExpense,
          ]}>
          <View style={styles.expenseHeader}>
            <Text style={styles.expenseName}>{item.description}</Text>
            <Text style={styles.expenseAmount}>₹{item.amount.toFixed(2)}</Text>
          </View>
          <Text style={styles.expenseDetail}>
            Paid by: {paidBy} - {date}
          </Text>
          <Text style={styles.expenseDetail}>
            Split between:{' '}
            {item.splitBetween
              .map((id: string) =>
                id === loggedInUserId ? 'You' : friend.name,
              )
              .join(', ')}
          </Text>
          <Text style={styles.splitAmount}>
            {item.paidBy === loggedInUserId
              ? `You paid ₹${splitAmount.toFixed(2)}`
              : `${friend.name} paid ₹${splitAmount.toFixed(2)}`}
          </Text>
        </View>
      </Pressable>
    );
  };

  useEffect(() => {
    let owed = 0;
    expenses.forEach(expense => {
      const splitAmount = expense.amount / expense.splitBetween.length;
      if (
        expense.paidBy !== loggedInUserId &&
        expense.splitBetween.includes(loggedInUserId)
      ) {
        owed += splitAmount;
      } else if (
        expense.paidBy === loggedInUserId &&
        expense.splitBetween.includes(loggedInUserId)
      ) {
        owed -= splitAmount;
      }
    });
    setTotalOwed(owed);
  }, [expenses, loggedInUserId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Total {totalOwed >= 0 ? 'Owes' : 'Gets back'}: ₹
          {Math.abs(totalOwed).toFixed(2)}
        </Text>
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.actionButton, styles.settleButton]}
            onPress={handleSettleUp}>
            <Text style={styles.actionButtonText}>Settle Up</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.addButton]}
            onPress={() =>
              navigation.navigate('FriendExpenseDetails', {friend})
            }>
            <Text style={styles.actionButtonText}>Add Expense</Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={expenses}
        keyExtractor={item => item.id}
        renderItem={renderExpenseItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No expenses found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#007bff',
  },
  settleButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  expenseItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  highlightedExpense: {
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  expenseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  expenseDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  splitAmount: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default AddFriendExpense;
