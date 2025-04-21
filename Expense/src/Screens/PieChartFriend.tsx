import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {PieChart} from 'react-native-chart-kit';
import {format, subDays, isWithinInterval, startOfDay} from 'date-fns';
import {useSelector} from 'react-redux';
import {RootState} from '../Redux/store';

interface ChartData {
  name: string;
  amount: number;
  color: string;
  legendFontColor: string;
  legendFontSize: 15;
}

interface DailyExpense {
  date: string;
  userPaid: number;
  friendPaid: number;
}

const PiChartFriend = () => {
  const route = useRoute();
  const {friend, expenses} = route.params as any;
  const loggedInUserId = useSelector((state: RootState) => state.auth.userId);
  const [loading, setLoading] = useState(true);
  const [pieChartData, setPieChartData] = useState<ChartData[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
  const [totalUserPaid, setTotalUserPaid] = useState(0);
  const [totalFriendPaid, setTotalFriendPaid] = useState(0);

  const colors = ['#FF9500', '#007AFF', '#34C759', '#FF3B30', '#5856D6'];

  useEffect(() => {
    if (!expenses || !loggedInUserId) return;

    const fiveDaysAgo = startOfDay(subDays(new Date(), 5));

    let userPaidTotal = 0;
    let friendPaidTotal = 0;

    const dailyData: Record<string, DailyExpense> = {};

    for (let i = 0; i < 5; i++) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      dailyData[dateStr] = {
        date: format(date, 'MMM dd'),
        userPaid: 0,
        friendPaid: 0,
      };
    }
    expenses.forEach((expense: any) => {
      if (expense.paidBy === loggedInUserId) {
        userPaidTotal += expense.amount;
      } else {
        friendPaidTotal += expense.amount;
      }

      const expenseDate = new Date(expense.createdAt);
      if (
        isWithinInterval(expenseDate, {start: fiveDaysAgo, end: new Date()})
      ) {
        const dateStr = format(expenseDate, 'yyyy-MM-dd');

        if (!dailyData[dateStr]) {
          dailyData[dateStr] = {
            date: format(expenseDate, 'MMM dd'),
            userPaid: 0,
            friendPaid: 0,
          };
        }

        if (expense.paidBy === loggedInUserId) {
          dailyData[dateStr].userPaid += expense.amount;
        } else {
          dailyData[dateStr].friendPaid += expense.amount;
        }
      }
    });

    setTotalUserPaid(userPaidTotal);
    setTotalFriendPaid(friendPaidTotal);

    const chartData: ChartData[] = [];

    if (userPaidTotal > 0) {
      chartData.push({
        name: 'You paid',
        amount: userPaidTotal,
        color: '#007AFF',
        legendFontColor: '#333',
        legendFontSize: 15,
      });
    }

    if (friendPaidTotal > 0) {
      chartData.push({
        name: `${friend.name} paid`,
        amount: friendPaidTotal,
        color: '#FF9500',
        legendFontColor: '#333',
        legendFontSize: 15,
      });
    }

    if (chartData.length === 0) {
      chartData.push({
        name: 'No expenses',
        amount: 1,
        color: '#CCCCCC',
        legendFontColor: '#999',
        legendFontSize: 15,
      });
    }

    setPieChartData(chartData);
    setDailyExpenses(
      Object.values(dailyData).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    );
    setLoading(false);
  }, [expenses, loggedInUserId, friend]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width - 32;

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
  };

  const calculateBalance = () => {
    const totalExpenses = totalUserPaid + totalFriendPaid;
    const shouldHavePaid = totalExpenses / 2;
    const userBalance = totalUserPaid - shouldHavePaid;

    if (userBalance > 0) {
      return `${friend.name} owes you ₹${userBalance.toFixed(2)}`;
    } else if (userBalance < 0) {
      return `You owe ${friend.name} ₹${Math.abs(userBalance).toFixed(2)}`;
    } else {
      return "You're all settled up!";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Expense Distribution</Text>
          <Text style={styles.subHeaderText}>
            All Transactions with {friend.name}
          </Text>
        </View>

        <View style={styles.chartContainer}>
          {pieChartData.length > 0 && (
            <PieChart
              data={pieChartData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          )}
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.balanceText}>{calculateBalance()}</Text>
          <Text style={styles.totalText}>
            Total Transactions: ₹{(totalUserPaid + totalFriendPaid).toFixed(2)}
          </Text>
          <View style={styles.totalsRow}>
            <Text style={[styles.paidText, styles.userPaidText]}>
              You paid: ₹{totalUserPaid.toFixed(2)}
            </Text>
            <Text style={[styles.paidText, styles.friendPaidText]}>
              {friend.name} paid: ₹{totalFriendPaid.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.dailyExpensesContainer}>
          <Text style={styles.sectionHeader}>Last 5 Days Breakdown</Text>

          {dailyExpenses.length > 0 ? (
            dailyExpenses.map((dayData, index) => (
              <View key={index} style={styles.dayContainer}>
                <Text style={styles.dateText}>{dayData.date}</Text>
                <View style={styles.expenseRow}>
                  <View
                    style={[
                      styles.expenseBar,
                      styles.userBar,
                      {flex: dayData.userPaid || 0.01},
                    ]}>
                    <Text style={styles.barText}>
                      {dayData.userPaid > 0
                        ? `₹${dayData.userPaid.toFixed(0)}`
                        : ''}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.expenseBar,
                      styles.friendBar,
                      {flex: dayData.friendPaid || 0.01},
                    ]}>
                    <Text style={styles.barText}>
                      {dayData.friendPaid > 0
                        ? `₹${dayData.friendPaid.toFixed(0)}`
                        : ''}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>
              No expenses in the last 5 days
            </Text>
          )}
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, {backgroundColor: '#007AFF'}]} />
            <Text style={styles.legendText}>You paid</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, {backgroundColor: '#FF9500'}]} />
            <Text style={styles.legendText}>{friend.name} paid</Text>
          </View>
        </View>

        <Text style={styles.summaryText}>
          Recent expenses (last 5 days): ₹
          {dailyExpenses
            .reduce((sum, day) => sum + day.userPaid + day.friendPaid, 0)
            .toFixed(2)}
        </Text>
      </ScrollView>
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
  headerContainer: {
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#29846A',
  },
  subHeaderText: {
    fontSize: 16,
    color: 'grey',
    marginTop: 4,
  },
  chartContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginVertical: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4BBC9B',
    textAlign: 'center',
    marginBottom: 8,
  },
  totalText: {
    fontSize: 16,
    color: 'grey',
    textAlign: 'center',
    marginBottom: 8,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paidText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  userPaidText: {
    color: '#007AFF',
  },
  friendPaidText: {
    color: '#FF9500',
  },
  dailyExpensesContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#4bbc9b',
  },
  dayContainer: {
    marginVertical: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'grey',
  },
  expenseRow: {
    flexDirection: 'row',
    height: 30,
    borderRadius: 4,
    overflow: 'hidden',
  },
  expenseBar: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    minWidth: 30,
  },
  userBar: {
    backgroundColor: '#007AFF',
  },
  friendBar: {
    backgroundColor: '#FF9500',
  },
  barText: {
    color: '#4BBC9B',
    fontSize: 12,
    fontWeight: '900',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#4bbc9b',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#29846A',
    textAlign: 'center',
    margin: 16,
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
});

export default PiChartFriend;
