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
  Alert,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '../Redux/store';
import {fetchGroupDetails, fetchUserDetails} from '../Redux/slice/GroupSlice';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useFocusEffect} from '@react-navigation/native';
import {useIsFocused} from '@react-navigation/native';
import {
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  doc,
} from 'firebase/firestore';
import {db} from '../services/firestore';
import {format} from 'date-fns';
import {calculateSettlements} from '../utils/Expenssutils';
import type {AppDispatch} from '../Redux/store';
import {
  RootStackParamList,
  Settlement,
  MemberBalance,
  Expense,
} from '../types/types';

type GroupDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  'GroupDetails'
>;
type GroupDetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'GroupDetails'
>;

const GroupDetailsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<GroupDetailsScreenNavigationProp>();
  const {selectedGroup, loading, error, memberNames} = useSelector(
    (state: RootState) => state.group,
  );
  const {userId: currentUserId} = useSelector((state: RootState) => state.auth);
  const route = useRoute<GroupDetailsScreenRouteProp>();
  const {groupId} = route.params;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [memberBalances, setMemberBalances] = useState<MemberBalance[]>([]);
  const [userTransactions, setUserTransactions] = useState<Settlement[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused && groupId) {
      if (!selectedGroup || selectedGroup.id !== groupId) {
        dispatch(fetchGroupDetails(groupId));
      }
    }
  }, [isFocused, groupId, selectedGroup?.id, dispatch]);

  useEffect(() => {
    if (!groupId) return;

    const expensesQuery = query(
      collection(db, 'expenses'),
      where('groupId', '==', groupId),
    );

    const unsubscribe = onSnapshot(expensesQuery, querySnapshot => {
      const newExpenses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));

      setExpenses(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(newExpenses)) {
          return newExpenses;
        }
        return prev;
      });
      setExpensesLoading(false);
    });

    return unsubscribe;
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

    selectedGroup?.members.forEach((memberId: string) => {
      balances[memberId] = 0;
    });

    expenses.forEach(expense => {
      const participants = expense.splitBetween.includes(expense.paidBy)
        ? expense.splitBetween
        : [...expense.splitBetween, expense.paidBy];

      const sharePerPerson = expense.amount / participants.length;

      balances[expense.paidBy] += expense.amount;

      participants.forEach(memberId => {
        balances[memberId] -= sharePerPerson;
      });
    });

    if (currentUserId && balances[currentUserId]) {
      setTotalBalance(balances[currentUserId]);
    }

    const settlements = calculateSettlements(balances);
    if (currentUserId) {
      const userSettlements = settlements.filter(
        s => s.from === currentUserId || s.to === currentUserId,
      );
      setUserTransactions(userSettlements);
    }

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

  const handleSettleUp = async () => {
    if (expenses.length === 0) {
      Alert.alert('No expenses to settle');
      return;
    }

    Alert.alert(
      'Confirm Settlement',
      `Are you sure you want to clear all ${expenses.length} expenses in this group`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Settle Up',
          onPress: async () => {
            try {
              const batch = writeBatch(db);

              expenses.forEach(expense => {
                const expenseRef = doc(db, 'expenses', expense.id);
                batch.delete(expenseRef);
              });

              await batch.commit();

              // Reset all balance states
              setExpenses([]);
              setMemberBalances([]);
              setUserTransactions([]);
              setTotalBalance(0);
            } catch (error) {
              console.error('Error settling up:', error);
              Alert.alert('Error', 'Failed to settle up. Please try again.');
            }
          },
        },
      ],
    );
  };
  const renderExpenseItem = ({item}: {item: Expense}) => {
    const formattedDate = format(item.createdAt, 'MMM dd, yyyy');
    const paidByName = memberNames[item.paidBy] || item.paidBy;
    const isCurrentUserExpense = item.paidBy === currentUserId;

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('EditExpense', {
            groupId: groupId,
            expenseId: item.id,
          })
        }>
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
      </TouchableOpacity>
    );
  };

  const renderBalanceItem = ({item}: {item: MemberBalance}) => {
    const isCurrentUser = item.memberId === currentUserId;
    const isPositive = item.balance > 0;
    const isZero = Math.abs(item.balance) < 0.01;

    if (isCurrentUser) return null;

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
  const prepareChartData = () => {
    if (!expenses.length) {
      Alert.alert(
        'No expenses',
        'There are no expenses to display in the chart',
      );
      return;
    }

    const memberExpenses: Record<string, number> = {};

    selectedGroup?.members.forEach((memberId: string) => {
      memberExpenses[memberId] = 0;
    });

    expenses.forEach(expense => {
      memberExpenses[expense.paidBy] += expense.amount;
    });

    const data = Object.entries(memberExpenses)
      .filter(([_, amount]) => amount > 0)
      .map(([memberId, amount]) => ({
        name: memberNames[memberId] || memberId,
        amount,
        color: getRandomColor(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      }));
    navigation.navigate('PieChart', {
      chartData: data,
      groupName: selectedGroup?.groupName || 'Group',
      memberBalances: memberBalances,
    });
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headercontainer}>
        <Text style={styles.groupName}>{selectedGroup.groupName}</Text>
        {selectedGroup.groupImageUrl && (
          <Image
            source={{uri: selectedGroup.groupImageUrl}}
            style={styles.groupImage}
            resizeMode="cover"
          />
        )}
      </View>
      <View style={styles.tabButtonContainer}>
        <TouchableOpacity
          style={[styles.tabButton, styles.addButton]}
          onPress={handleAddExpense}>
          <Text style={styles.tabButtonText}>Add Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, styles.settleButton]}
          onPress={handleSettleUp}>
          <Text style={styles.tabButtonText}>Settle Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, styles.chartButton]}
          onPress={prepareChartData}>
          <Text style={styles.tabButtonText}>View Chart</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.container}>
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

        <Text style={styles.sectionTitle}>Expenses</Text>
        {expenses.length === 0 ? (
          <Text style={styles.noExpensesText}>No expenses yet</Text>
        ) : (
          <FlatList
            data={expenses}
            style={styles.ex}
            renderItem={renderExpenseItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  ex: {
    marginBottom: 20,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 10,
  },
  chartButton: {
    backgroundColor: '#29846A',
  },
  chartButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    width: '95%',
    alignSelf: 'center',
    height: 150,
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 10,
  },
  groupName: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    marginHorizontal: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CBB9B',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#4CBB9B',
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
  headercontainer: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 10,
    elevation: 5,
    shadowOpacity: 0.5,
    marginTop: 10,
  },
  highlightedExpense: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CBB9B',
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
    color: 'grey',
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
    color: 'grey',
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
  tabButtonContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    height: 50,
  },
  tabButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 18,
  },

  tabButtonActive: {
    borderBottomColor: '#33FFFF',
  },
  tabButtonTextActive: {
    color: '#33FFFF',
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
    color: '#ff3b30',
  },
  positiveBalance: {
    color: '#34C759',
  },
  negativeBalance: {
    color: '#ff3b30',
  },
  zeroBalance: {
    color: '#999',
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
    color: '#4CBB9B',
  },

  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  settleButton: {
    backgroundColor: '#29846A',
    marginRight: 6,
    elevation: 5,
  },
  addButton: {
    backgroundColor: '#29846A',
    marginRight: 6,
    elevation: 5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default GroupDetailsScreen;
