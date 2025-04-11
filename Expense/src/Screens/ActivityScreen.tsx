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

const ActivityScreen = () => {
  // Get userId from Redux store instead of local state
  const {userId, isAuthenticated} = useSelector(state => state.auth);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Only fetch data if user is authenticated and userId exists
    if (!isAuthenticated || !userId) {
      setLoading(false);
      return;
    }

    const fetchUsersAndActivities = async () => {
      try {
        console.log('Fetching activities for user:', userId);
        const userSnap = await getDocs(collection(db, 'users'));
        const userNameMap: {[key: string]: string} = {};
        userSnap.forEach(doc => {
          const userData = doc.data();
          userNameMap[doc.id] = userData.name || 'Unknown User';
        });
        setUserMap(userNameMap);

        const groupSnap = await getDocs(collection(db, 'groups'));
        const friendSnap = await getDocs(collection(db, 'friends'));
        const expenseSnap = await getDocs(collection(db, 'expenses'));
        const friendExpenseSnap = await getDocs(
          collection(db, 'friend_expenses'),
        );

        const allActivities: any[] = [];

        const userInvolved = (data: any) =>
          data.createdBy === userId ||
          data.paidBy === userId ||
          data.friend1 === userId ||
          data.friend2 === userId ||
          (Array.isArray(data.members) && data.members.includes(userId)) ||
          (Array.isArray(data.participants) &&
            data.participants.includes(userId)) ||
          (Array.isArray(data.friends) && data.friends.includes(userId));

        const parseActivity = (doc: any, type: string) => {
          const data = doc.data();
          return {
            id: doc.id,
            type,
            ...data,
            createdAt: data.createdAt?.toDate?.() || null,
            createdBy: userNameMap[data.createdBy || data.paidBy] || 'Unknown',
          };
        };

        groupSnap.forEach(doc => {
          const data = doc.data();
          if (userInvolved(data)) {
            allActivities.push({
              id: doc.id,
              type: 'group',
              ...data,
              createdAt: data.createdAt?.toDate?.() || null,
              createdBy: userNameMap[data.createdBy] || 'Unknown',
            });
          }
        });

        friendSnap.forEach(doc => {
          const data = doc.data();
          if (userInvolved(data)) {
            allActivities.push(parseActivity(doc, 'friend'));
          }
        });

        expenseSnap.forEach(doc => {
          const data = doc.data();
          if (userInvolved(data)) {
            allActivities.push(parseActivity(doc, 'groupExpense'));
          }
        });

        friendExpenseSnap.forEach(doc => {
          const data = doc.data();
          if (userInvolved(data)) {
            allActivities.push(parseActivity(doc, 'friendExpense'));
          }
        });

        allActivities.sort(
          (a, b) => (b.createdAt as any) - (a.createdAt as any),
        );

        setActivities(allActivities);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setLoading(false);
      }
    };

    fetchUsersAndActivities();
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

    return (
      <View style={[styles.card, {borderLeftColor: color}]}>
        <View style={styles.row}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
          <Text style={[styles.type, {color}]}>
            {item.type.replace(/([A-Z])/g, ' $1')}
          </Text>
        </View>

        <Text style={styles.desc}>
          {item.groupName || item.name || item.description || 'No description'}
        </Text>

        {item.amount && (
          <Text style={[styles.amount, {color}]}>₹{item.amount}</Text>
        )}

        {item.createdBy && (
          <Text style={styles.creator}>
            {item.type.includes('Expense') ? `Paid by: ` : `Created by: `}
            {item.createdBy}
          </Text>
        )}

        <Text style={styles.time}>
          {item.createdAt instanceof Date
            ? item.createdAt.toLocaleString()
            : 'No date available'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.loader}>
        <Text style={{fontSize: 16}}>
          Please log in to view your activities.
        </Text>
      </View>
    );
  }

  return activities.length === 0 ? (
    <View style={styles.loader}>
      <Text style={{fontSize: 16}}>No activity found for your account.</Text>
    </View>
  ) : (
    <FlatList
      data={activities}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={{padding: 16}}
    />
  );
};

export default ActivityScreen;

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  type: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  desc: {
    color: '#333',
    fontSize: 14,
    marginBottom: 4,
  },
  amount: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },
  creator: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
});
