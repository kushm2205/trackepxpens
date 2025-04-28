import React from 'react';
import {View, Text, StyleSheet, Dimensions, ScrollView} from 'react-native';
import {PieChart} from 'react-native-chart-kit';
import {useSelector} from 'react-redux';
import {RootState} from '../Redux/store';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {MemberBalance, RootStackParamList} from '../types/types';
import {ChartData} from 'react-native-chart-kit/dist/HelperTypes';

// type PieChartScreenProps = NativeStackScreenProps<
//   RootStackParamList,
//   'PieChart'
// > & {
//   route: {
//     params: {
//       chartData: ChartData[];
//       groupName: string;
//       memberBalances: MemberBalance[];
//     };
//   };
// };
export type PieChartScreenParams = {
  chartData: ChartData[];
  groupName: string;
  memberBalances: MemberBalance[];
};
type PieChartScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'PieChart'
>;
const PieChartScreen: React.FC<PieChartScreenProps> = ({route, navigation}) => {
  const {chartData, groupName, memberBalances} = route.params;
  const {userId: currentUserId} = useSelector((state: RootState) => state.auth);
  const screenWidth = Dimensions.get('window').width;

  const userBalances = memberBalances
    .filter(member => member.memberId !== currentUserId)
    .map(member => {
      const amount = member.balance;
      return {
        ...member,
        amount: Math.abs(amount),
        type: amount > 0 ? 'owes' : 'owed',
      };
    });

  const userChartData = userBalances
    .filter(member => member.amount > 0)
    .map(member => ({
      name: `${member.name}  (${
        member.type === 'owed' ? 'owes you' : 'you owe'
      })`,
      amount: member.amount,
      color: member.type === 'owed' ? '#4CAF50' : '#F44336',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));

  const totalOwed = userBalances
    .filter(m => m.type === 'owed')
    .reduce((sum, m) => sum + m.amount, 0);
  const totalOwes = userBalances
    .filter(m => m.type === 'owes')
    .reduce((sum, m) => sum + m.amount, 0);
  const netBalance = totalOwed - totalOwes;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{groupName} Expense Distribution</Text>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Your Net Balance</Text>
        <Text
          style={[
            styles.netBalance,
            netBalance > 0
              ? styles.positiveBalance
              : netBalance < 0
              ? styles.negativeBalance
              : styles.neutralBalance,
          ]}>
          {netBalance > 0
            ? `You get back ₹${netBalance.toFixed(2)}`
            : netBalance < 0
            ? `You owe ₹${Math.abs(netBalance).toFixed(2)}`
            : 'You are settled up!'}
        </Text>
      </View>

      {userChartData && userChartData.length > 0 ? (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Your Settlement Status</Text>
          <PieChart
            data={userChartData}
            width={screenWidth - 50}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            hasLegend={true}
          />
        </View>
      ) : (
        <Text style={styles.noDataText}>No personal balances to display</Text>
      )}

      {userBalances.length > 0 && (
        <View style={styles.balancesContainer}>
          <Text style={styles.sectionTitle}>Detailed Balances</Text>
          {userBalances.map((member, index) => (
            <View key={index} style={styles.balanceItem}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text
                style={[
                  styles.memberAmount,
                  member.type === 'owed'
                    ? styles.positiveAmount
                    : styles.negativeAmount,
                ]}>
                {member.type === 'owed'
                  ? `Owes you ₹${member.amount.toFixed(2)}`
                  : `You owe ₹${member.amount.toFixed(2)}`}
              </Text>
            </View>
          ))}
        </View>
      )}

      {chartData && chartData.length > 0 ? (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Group Expense Distribution</Text>
          <PieChart
            data={chartData}
            width={screenWidth - 50}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            hasLegend={true}
          />
        </View>
      ) : (
        <Text style={styles.noDataText}>No expense data available</Text>
      )}

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total you owe others:</Text>
          <Text style={styles.negativeAmount}>₹{totalOwes.toFixed(2)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total owed to you:</Text>
          <Text style={styles.positiveAmount}>₹{totalOwed.toFixed(2)}</Text>
        </View>
        <View style={[styles.statItem, styles.netBalanceItem]}>
          <Text style={styles.statLabel}>Net balance:</Text>
          <Text
            style={[
              netBalance > 0
                ? styles.positiveAmount
                : netBalance < 0
                ? styles.negativeAmount
                : styles.neutralAmount,
            ]}>
            ₹{netBalance.toFixed(2)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#29846A',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  summaryContainer: {
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
  chartContainer: {
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#4CBB9C',
  },
  netBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  positiveBalance: {
    color: '#4CAF50', // Green
  },
  negativeBalance: {
    color: '#F44336', // Red
  },
  neutralBalance: {
    color: '#2196F3', // Blue
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#4CBB9B',
  },
  balancesContainer: {
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
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberName: {
    fontSize: 14,
    color: '#333',
  },
  memberAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: '#4CAF50', // Green
  },
  negativeAmount: {
    color: '#F44336', // Red
  },
  neutralAmount: {
    color: '#2196F3', // Blue
  },
  statsContainer: {
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
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  netBalanceItem: {
    borderBottomWidth: 0,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#eee',
  },
  statLabel: {
    fontSize: 14,
    color: '#333',
  },
});

export default PieChartScreen;
