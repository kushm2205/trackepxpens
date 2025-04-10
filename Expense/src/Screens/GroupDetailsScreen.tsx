import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '../Redux/store';
import {fetchGroupDetails, fetchUserDetails} from '../Redux/slice/GroupSlice';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {collection, query, where, onSnapshot} from 'firebase/firestore';
import {db} from '../services/firestore';
import {format} from 'date-fns';
import {calculateSettlements} from '../utils/Expenssutils';

type RootStackParamList = {
  GroupDetails: {groupId: string};
  AddExpense: {groupId: string};
};

type GroupDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  'GroupDetails'
>;
type GroupDetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'GroupDetails'
>;

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  createdAt: any;
}

interface MemberBalance {
  memberId: string;
  name: string;
  balance: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

const GroupDetailsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<GroupDetailsScreenNavigationProp>();
  const {selectedGroup, loading, error, memberNames} = useSelector(
    (state: RootState) => state.Group,
  );
  const {userId: currentUserId} = useSelector((state: RootState) => state.auth);
  const route = useRoute<GroupDetailsScreenRouteProp>();
  const {groupId} = route.params;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [memberBalances, setMemberBalances] = useState<MemberBalance[]>([]);
  const [userTransactions, setUserTransactions] = useState<Settlement[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    dispatch(fetchGroupDetails(groupId));
  }, [dispatch, groupId]);

  useEffect(() => {
    if (!groupId) return;

    const expensesQuery = query(
      collection(db, 'expenses'),
      where('groupId', '==', groupId),
    );

    const unsubscribe = onSnapshot(expensesQuery, querySnapshot => {
      const expensesData: Expense[] = [];
      querySnapshot.forEach(doc => {
        console.log('doc_Data', doc.data());
        const data = doc.data();
        expensesData.push({
          id: doc.id,
          description: data.description,
          amount: data.amount,
          paidBy: data.paidBy,
          splitBetween: data.splitBetween,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      expensesData.sort((a, b) => b.createdAt - a.createdAt);
      setExpenses(expensesData);
      setExpensesLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    if (selectedGroup && selectedGroup.members) {
      selectedGroup.members.forEach((memberId: string) => {
        if (!memberNames[memberId]) {
          dispatch(fetchUserDetails(memberId));
        }
      });
    }
  }, [dispatch, selectedGroup, memberNames]);

  useEffect(() => {
    if (selectedGroup && expenses.length > 0 && currentUserId) {
      calculateBalances();
    }
  }, [expenses, selectedGroup, memberNames, currentUserId]);

  const calculateBalances = () => {
    const balances: Record<string, number> = {};

    // Initialize all members with 0 balance
    selectedGroup?.members.forEach((memberId: string) => {
      balances[memberId] = 0;
    });

    // Calculate balances from expenses
    expenses.forEach(expense => {
      // Ensure the payer is included in splitBetween
      const participants = expense.splitBetween.includes(expense.paidBy)
        ? expense.splitBetween
        : [...expense.splitBetween, expense.paidBy];

      const sharePerPerson = expense.amount / participants.length;

      // Add the full amount to the person who paid
      balances[expense.paidBy] += expense.amount;

      // Subtract each person's share (including the payer if they're in the split)
      participants.forEach(memberId => {
        balances[memberId] -= sharePerPerson;
      });
    });

    // Calculate user's total balance
    if (currentUserId && balances[currentUserId]) {
      setTotalBalance(balances[currentUserId]);
    }

    // Calculate settlement transactions
    const settlements = calculateSettlements(balances);

    // Filter settlements related to current user
    if (currentUserId) {
      const userSettlements = settlements.filter(
        s => s.from === currentUserId || s.to === currentUserId,
      );
      setUserTransactions(userSettlements);
    }

    // Convert to array and sort by balance
    const balanceArray: MemberBalance[] = Object.entries(balances)
      .map(([memberId, balance]) => ({
        memberId,
        name: memberNames[memberId] || memberId,
        balance,
      }))
      .sort((a, b) => b.balance - a.balance);

    setMemberBalances(balanceArray);
  };

  const handleAddExpense = () => {
    navigation.navigate('AddExpense', {groupId: groupId});
  };

  const renderExpenseItem = ({item}: {item: Expense}) => {
    const formattedDate = format(item.createdAt, 'MMM dd, yyyy');
    const paidByName = memberNames[item.paidBy] || item.paidBy;
    const isCurrentUserExpense = item.paidBy === currentUserId;

    return (
      <View
        style={[
          styles.expenseItem,
          isCurrentUserExpense && styles.highlightedExpense,
        ]}>
        <View style={styles.expenseHeader}>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <Text style={styles.expenseAmount}>₹{item.amount.toFixed(2)}</Text>
        </View>
        <Text style={styles.expensePaidBy}>
          Paid by {isCurrentUserExpense ? 'You' : paidByName}
        </Text>
        <Text style={styles.expenseDate}>{formattedDate}</Text>
        <Text style={styles.expenseSplit}>
          Split between:{' '}
          {item.splitBetween
            .map(id => (id === currentUserId ? 'You' : memberNames[id] || id))
            .join(', ')}
        </Text>
      </View>
    );
  };

  const renderBalanceItem = ({item}: {item: MemberBalance}) => {
    const isCurrentUser = item.memberId === currentUserId;
    const isPositive = item.balance > 0;
    const isZero = Math.abs(item.balance) < 0.01;

    if (isCurrentUser) return null; // Skip the current user in the list

    return (
      <View style={styles.balanceItem}>
        <Text style={styles.balanceName}>{item.name}</Text>
        <Text
          style={[
            styles.balanceAmount,
            isPositive && styles.positiveBalance,
            isZero && styles.zeroBalance,
          ]}>
          {isPositive ? 'gets back' : 'owes'} ₹
          {Math.abs(item.balance).toFixed(2)}
        </Text>
      </View>
    );
  };

  const renderTransactionItem = ({item}: {item: Settlement}) => {
    const isReceiving = item.to === currentUserId;
    const otherUser = isReceiving ? item.from : item.to;
    const otherUserName = memberNames[otherUser] || otherUser;

    return (
      <View style={styles.transactionItem}>
        <Text style={styles.transactionText}>
          {isReceiving ? (
            <Text>
              <Text style={styles.transactionName}>{otherUserName}</Text> owes
              you ₹
              <Text style={styles.transactionAmount}>
                {item.amount.toFixed(2)}
              </Text>
            </Text>
          ) : (
            <Text>
              You owe{' '}
              <Text style={styles.transactionName}>{otherUserName}</Text> ₹
              <Text style={styles.transactionAmount}>
                {item.amount.toFixed(2)}
              </Text>
            </Text>
          )}
        </Text>
      </View>
    );
  };

  if (loading || expensesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (error || !selectedGroup) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Group not found'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container}>
        {selectedGroup.groupImageUrl && (
          <Image
            source={{uri: selectedGroup.groupImageUrl}}
            style={styles.groupImage}
            resizeMode="cover"
          />
        )}

        <Text style={styles.groupName}>{selectedGroup.groupName}</Text>

        {/* Current User's Grand Total */}
        <Text style={styles.sectionTitle}>Your Balance</Text>
        <View style={styles.userBalanceContainer}>
          {totalBalance !== 0 ? (
            <Text
              style={[
                styles.totalBalance,
                totalBalance > 0
                  ? styles.positiveBalance
                  : styles.negativeBalance,
              ]}>
              {totalBalance > 0
                ? `You get back ₹${Math.abs(totalBalance).toFixed(2)}`
                : `You owe ₹${Math.abs(totalBalance).toFixed(2)}`}
            </Text>
          ) : (
            <Text style={styles.balancedText}>You're all settled up!</Text>
          )}
        </View>

        {/* Simplified Transactions for Current User */}
        {userTransactions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your Transactions</Text>
            <View style={styles.balanceContainer}>
              <FlatList
                data={userTransactions}
                renderItem={renderTransactionItem}
                keyExtractor={(item, index) => `transaction-${index}`}
                scrollEnabled={false}
              />
            </View>
          </>
        )}

        {/* Overall Group Balances */}
        <Text style={styles.sectionTitle}>Group Balances</Text>
        <View style={styles.balanceContainer}>
          {memberBalances.length > 0 ? (
            <FlatList
              data={memberBalances}
              renderItem={renderBalanceItem}
              keyExtractor={item => item.memberId}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noExpensesText}>No balances to show</Text>
          )}
        </View>

        {/* Expenses Section */}
        <Text style={styles.sectionTitle}>Expenses</Text>
        {expenses.length === 0 ? (
          <Text style={styles.noExpensesText}>No expenses yet</Text>
        ) : (
          <FlatList
            data={expenses}
            renderItem={renderExpenseItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        )}

        {/* Members Section */}
        <Text style={styles.sectionTitle}>Members</Text>
        <View style={styles.membersContainer}>
          {selectedGroup.members.map((memberId: string) => (
            <View key={memberId} style={styles.memberItem}>
              <Text
                style={[
                  styles.memberName,
                  memberId === currentUserId && styles.currentUserHighlight,
                ]}>
                {memberId === currentUserId
                  ? `${memberNames[memberId] || memberId} (You)`
                  : memberNames[memberId] || memberId}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Expense Button */}
      <TouchableOpacity
        style={styles.addExpenseButton}
        onPress={handleAddExpense}>
        <Text style={styles.addExpenseButtonText}>Add Expense</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
  },
  groupImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  expenseItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
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
  expenseDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    color: '#333',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  expensePaidBy: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  expenseSplit: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  noExpensesText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  balanceContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userBalanceContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  totalBalance: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  balancedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  balanceName: {
    fontSize: 16,
    color: '#333',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff3b30', // Default red for owes
  },
  positiveBalance: {
    color: '#34C759', // Green for gets back
  },
  negativeBalance: {
    color: '#ff3b30', // Red for owes
  },
  zeroBalance: {
    color: '#999', // Gray for zero
  },
  transactionItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  transactionText: {
    fontSize: 16,
    color: '#333',
  },
  transactionName: {
    fontWeight: 'bold',
  },
  transactionAmount: {
    fontWeight: 'bold',
  },
  membersContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memberItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberName: {
    fontSize: 16,
    color: '#333',
  },
  currentUserHighlight: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  addExpenseButton: {
    backgroundColor: '#007bff',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExpenseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default GroupDetailsScreen;
