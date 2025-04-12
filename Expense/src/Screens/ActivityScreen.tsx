import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {collection, getDocs} from 'firebase/firestore';
import {useSelector} from 'react-redux';
import {db} from '../services/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AuthState, ActivityItem} from '../types/types';

const ActivityScreen = () => {
  const {
    userId,
    isAuthenticated,
    loading: authLoading,
  } = useSelector((state: AuthState) => state.auth);
  const [activities, setActivities] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [userMap, setUserMap] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setDataLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setDataLoading(true);

        const userSnap = await getDocs(collection(db, 'users'));
        const userNameMap: {[key: string]: string} = {};
        userSnap.forEach(doc => {
          userNameMap[doc.id] = doc.data().name || 'Unknown User';
        });
        setUserMap(userNameMap);

        // 2. Fetch all activity data in parallel
        const [groups, friends, expenses, friendExpenses] = await Promise.all([
          getDocs(collection(db, 'groups')),
          getDocs(collection(db, 'friends')),
          getDocs(collection(db, 'expenses')),
          getDocs(collection(db, 'friend_expenses')),
        ]);

        console.log('Group_Activit', groups);

        const isUserInvolved = (data: any) => {
          if (
            data.createdBy === userId ||
            data.paidBy === userId ||
            data.friend1 === userId ||
            data.friend2 === userId
          ) {
            return true;
          }

          const arrayFields = [
            data.members,
            data.participants,
            data.friends,
            data.splitBetween,
          ];

          return arrayFields.some(
            field => Array.isArray(field) && field.includes(userId),
          );
        };

        const processActivity = (doc: any, type: string) => {
          const data = doc.data();
          const paidById = data.paidBy;

          const someonePaidForMe =
            paidById &&
            paidById !== userId &&
            Array.isArray(data.splitBetween) &&
            data.splitBetween.includes(userId);

          let extraDesc = '';
          if (type.includes('Expense') || type === 'friend') {
            if (paidById === userId) {
              extraDesc = '(You paid)';
            } else if (someonePaidForMe) {
              extraDesc = `(${
                userNameMap[paidById] || 'Someone'
              } paid for you)`;
            }
          }

          return {
            id: doc.id,
            type,
            ...data,
            createdAt: data.createdAt,
            createdBy:
              type === 'group'
                ? userNameMap[data.createdBy || data.admin] || 'Unknown'
                : undefined,
            paidBy:
              type !== 'group' && paidById
                ? userNameMap[paidById] || 'Unknown'
                : undefined,
            someonePaidForMe,
            extraDesc,
          };
        };
        const allActivities: any[] = [];

        groups.forEach(doc => {
          const data = doc.data();
          console.log('Datasss', data);
          if (isUserInvolved(data)) {
            allActivities.push(processActivity(doc, 'group'));
          }
        });
        console.log('ALL_Activit', allActivities);

        friends.forEach(doc => {
          const data = doc.data();
          if (isUserInvolved(data)) {
            allActivities.push(processActivity(doc, 'friend'));
          }
        });

        expenses.forEach(doc => {
          const data = doc.data();
          if (isUserInvolved(data)) {
            allActivities.push(processActivity(doc, 'groupExpense'));
          }
        });

        friendExpenses.forEach(doc => {
          const data = doc.data();
          if (isUserInvolved(data)) {
            allActivities.push(processActivity(doc, 'friendExpense'));
          }
        });
        console.log(
          'Created+',
          allActivities[0].timestamp,
          '::',
          allActivities[0].timestamp,
        );
        allActivities.sort((a, b) => b.timestamp - a.timestamp);
        setActivities(allActivities);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [userId, isAuthenticated]);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'group':
        return {icon: 'account-group', color: '#4A90E2'};
      case 'friend':
        return {icon: 'account', color: '#7B61FF'};
      case 'groupExpense':
        return {icon: 'currency-inr', color: '#4CAF50'};
      case 'friendExpense':
        return {icon: 'cash-multiple', color: '#FF9800'};
      default:
        return {icon: 'alert-circle', color: '#9E9E9E'};
    }
  };

  const renderItem = ({item}: any) => {
    const {icon, color} = getTypeStyle(item.type);
    const isPaidForMe = item.someonePaidForMe;

    console.log('TIme__', item);

    return (
      <View
        style={[
          styles.card,
          {borderLeftColor: color},
          isPaidForMe && styles.paidForMeCard,
        ]}>
        <View style={styles.row}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
          <View style={styles.typeContainer}>
            <Text style={[styles.type, {color}]}>
              {item.type.replace(/([A-Z])/g, ' $1')}
            </Text>
            {isPaidForMe && (
              <Text style={styles.paidForMeText}>Paid for you</Text>
            )}
          </View>
        </View>

        <Text style={styles.desc}>
          {item.groupName || item.name || item.description || 'No description'}
          {item.extraDesc ? ` ${item.extraDesc}` : ''}
        </Text>

        {item.amount && (
          <Text style={[styles.amount, {color}]}>₹{item.amount}</Text>
        )}
        <View style={styles.footer}>
          {item.paidBy && (
            <Text style={styles.creator}>Paid by: {item.paidBy}</Text>
          )}
          {item.type === 'group' && item.createdBy && (
            <Text style={styles.creator}>Created by: {item.createdBy}</Text>
          )}
          <Text style={styles.time}>
            {new Date(item?.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  // 1. First check if auth state is loading
  if (authLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // 2. Then check authentication status
  if (!isAuthenticated) {
    return (
      <View style={styles.loader}>
        <Text style={styles.authMessage}>
          Please sign in to view activities
        </Text>
      </View>
    );
  }

  // 3. Then check if data is loading
  if (dataLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading your activities...</Text>
      </View>
    );
  }

  // 4. Finally render the content
  return activities.length === 0 ? (
    <View style={styles.loader}>
      <Text style={styles.infoText}>No activities found</Text>
    </View>
  ) : (
    <FlatList
      data={activities}
      keyExtractor={item => `${item.id}-${item.type}`}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authMessage: {
    fontSize: 16,
    color: '#666',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  infoText: {
    color: '#666',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  paidForMeCard: {
    backgroundColor: '#f8fff8',
    borderLeftWidth: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    flex: 1,
  },
  type: {
    fontWeight: '600',
    fontSize: 16,
  },
  paidForMeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 2,
  },
  desc: {
    color: '#333',
    fontSize: 14,
    marginBottom: 6,
  },
  amount: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creator: {
    fontSize: 12,
    color: '#666',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
});

export default ActivityScreen;
