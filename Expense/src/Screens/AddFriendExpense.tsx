import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  Pressable,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {Friend, RootStackParamList} from '../types/types';
import {useSelector} from 'react-redux';
import {RootState} from '../Redux/store';
import {StackNavigationProp} from '@react-navigation/stack';
import {collection, query, where, onSnapshot} from 'firebase/firestore';
import {db} from '../services/firestore';

type FriendExpenseListRouteProp = {
  friend: Friend;
};

const AddFriendExpense = () => {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {friend} = route.params as FriendExpenseListRouteProp;
  const loggedInUserId = useSelector((state: RootState) => state.auth.userId);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalOwed, setTotalOwed] = useState(0);
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!loggedInUserId) return;

      const friendId = friend.userId || friend.phone;

      // This query will find all expenses where:
      // 1. The logged-in user is part of the split
      // 2. The friendId is set to the current friend's ID
      const expensesQuery = query(
        collection(db, 'friend_expenses'),
        where('splitBetween', 'array-contains', loggedInUserId),
        where('friendId', '==', friendId),
      );

      const unsubscribe = onSnapshot(expensesQuery, querySnapshot => {
        const fetchedExpenses = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(
          `Found ${fetchedExpenses.length} expenses with ${friend.name}`,
        );
        setExpenses(fetchedExpenses);
      });

      return () => unsubscribe();
    };

    fetchExpenses();
  }, [loggedInUserId, friend]);

  const renderExpenseItem = ({item}: {item: any}) => {
    const splitAmount = item.amount / item.splitBetween.length;
    const paidBy = item.paidBy === loggedInUserId ? 'You' : friend.name;
    const date = item.createdAt
      ? item.createdAt.toDate().toLocaleDateString()
      : 'Date unavailable';

    return (
      <View style={styles.expenseItem}>
        <Text style={styles.expenseName}>{item.description}</Text>
        <Text style={styles.expenseDetail}>
          Paid by: {paidBy} - {date}
        </Text>
        <Text style={styles.expenseDetail}>
          Split between:{' '}
          {item.splitBetween
            .map((id: string) => (id === loggedInUserId ? 'You' : friend.name))
            .join(', ')}
        </Text>
        <Text style={styles.expenseAmount}>
          {item.paidBy === loggedInUserId
            ? `You paid ${splitAmount.toFixed(2)}`
            : `${friend.name} paid ${splitAmount.toFixed(2)}`}{' '}
        </Text>
      </View>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Total {totalOwed >= 0 ? 'Owes' : 'Gets back'}:{' '}
          {Math.abs(totalOwed).toFixed(2)}
        </Text>
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate('FriendExpenseDetails', {friend})}>
          <Text style={styles.addButtonText}>Add Expense</Text>
        </Pressable>
      </View>
      <FlatList
        data={expenses}
        keyExtractor={item => item.id}
        renderItem={renderExpenseItem}
      />
    </SafeAreaView>
  );
};

export default AddFriendExpense;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: 'white',
  },
  expenseItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  expenseName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseDetail: {
    fontSize: 14,
    color: 'gray',
  },
  expenseAmount: {
    fontSize: 15,
    marginTop: 5,
  },
});
