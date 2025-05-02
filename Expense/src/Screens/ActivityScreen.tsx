import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {collection, getDocs} from 'firebase/firestore';
import {useSelector} from 'react-redux';
import {db} from '../services/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AuthState, ActivityItem} from '../types/types';
type ActivityTab = 'all' | 'personal' | 'group' | 'friend';

const ActivityScreen = () => {
  const {
    userId,
    isAuthenticated,
    loading: authLoading,
  } = useSelector((state: AuthState) => state.auth);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [userMap, setUserMap] = useState<{[key: string]: string}>({});
  const [activeTab, setActiveTab] = useState<ActivityTab>('all');

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
          const userData = doc.data();
          userNameMap[userData.userId] = userData.name || 'Unknown User';
        });
        setUserMap(userNameMap);

        const [groups, friends, expenses, friendExpenses, personal] =
          await Promise.all([
            getDocs(collection(db, 'groups')),
            getDocs(collection(db, 'friends')),
            getDocs(collection(db, 'expenses')),
            getDocs(collection(db, 'friend_expenses')),
            getDocs(collection(db, 'personal_expenses')),
          ]);

        const isUserInvolved = (data: any, type: string) => {
          if (type === 'personal') {
            return data.userId === userId;
          }

          if (
            data.createdBy === userId ||
            data.paidBy === userId ||
            data.friend1 === userId ||
            data.friend2 === userId ||
            data.userId === userId
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

          const createdAt = data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt || Date.now());

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

          let description = data.description || 'No description';
          if (type === 'personal' && data.category) {
            description = `${description} (${data.category})`;
          }

          return {
            id: doc.id,
            type,
            ...data,
            createdAt,
            description: description,
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
            amount: data.amount || 0,
          };
        };

        const activities: any[] = [];

        groups.forEach(doc => {
          const data = doc.data();
          if (isUserInvolved(data, 'group')) {
            activities.push(processActivity(doc, 'group'));
          }
        });

        friends.forEach(doc => {
          const data = doc.data();
          if (isUserInvolved(data, 'friend')) {
            activities.push(processActivity(doc, 'friend'));
          }
        });

        expenses.forEach(doc => {
          const data = doc.data();
          if (isUserInvolved(data, 'groupExpense')) {
            activities.push(processActivity(doc, 'groupExpense'));
          }
        });

        friendExpenses.forEach(doc => {
          const data = doc.data();
          if (isUserInvolved(data, 'friendExpense')) {
            activities.push(processActivity(doc, 'friendExpense'));
          }
        });

        personal.forEach(doc => {
          const data = doc.data();
          if (isUserInvolved(data, 'personal')) {
            activities.push(processActivity(doc, 'personal'));
          }
        });

        activities.sort((a, b) => b.createdAt - a.createdAt);
        setAllActivities(activities);
        setFilteredActivities(activities);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [userId, isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredActivities(allActivities);
    } else {
      const filtered = allActivities.filter(activity => {
        if (activeTab === 'personal') {
          return activity.type === 'personal';
        } else if (activeTab === 'group') {
          return activity.type.includes('group');
        } else if (activeTab === 'friend') {
          return activity.type.includes('friend') || activity.type === 'friend';
        }
        return true;
      });
      setFilteredActivities(filtered);
    }
  }, [activeTab, allActivities]);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'group':
      case 'groupExpense':
        return {icon: 'account-group', color: '#4bbc9b'};
      case 'friend':
      case 'friendExpense':
        return {icon: 'account', color: '#069A03'};
      case 'personal':
        return {icon: 'wallet', color: '#616161'};
      default:
        return {icon: 'alert-circle', color: '#9E9E9E'};
    }
  };

  const formatDate = (date: Date) => {
    if (!date) return 'Unknown date';

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({item}: any) => {
    const {icon, color} = getTypeStyle(item.type);
    const isPaidForMe = item.someonePaidForMe;

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
              {item.type === 'personal'
                ? 'Personal Expense'
                : item.type.replace(/([A-Z])/g, ' $1')}
            </Text>
            {isPaidForMe && (
              <Text style={styles.paidForMeText}>Paid for you</Text>
            )}
          </View>
        </View>

        <Text style={styles.desc}>
          {item.type === 'personal'
            ? item.description
            : item.groupName ||
              item.name ||
              item.description ||
              'No description'}
          {item.extraDesc ? ` ${item.extraDesc}` : ''}
        </Text>

        {item.amount > 0 && (
          <Text style={[styles.amount, {color}]}>
            ₹{item.amount.toFixed(2)}
          </Text>
        )}

        <View style={styles.footer}>
          {item.paidBy && (
            <Text style={styles.creator}>Paid by: {item.paidBy}</Text>
          )}
          {item.type === 'group' && item.createdBy && (
            <Text style={styles.creator}>Created by: {item.createdBy}</Text>
          )}
          {item.type === 'personal' && item.category && (
            <Text style={styles.category}>Category: {item.category}</Text>
          )}
          <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  const renderTabButton = (tab: ActivityTab, label: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.7}>
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (authLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.loader}>
        <Text style={styles.authMessage}>
          Please sign in to view activities
        </Text>
      </View>
    );
  }

  if (dataLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4BBC9B" />
        <Text style={styles.loadingText}>Loading your activities...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Activity</Text>
      </View>
      <View style={styles.tabContainer}>
        {renderTabButton('all', 'All')}
        {renderTabButton('personal', 'Personal')}
        {renderTabButton('group', 'Group')}
        {renderTabButton('friend', 'Friend')}
      </View>

      {filteredActivities.length === 0 ? (
        <View style={styles.loader}>
          <Text style={styles.infoText}>
            No {activeTab === 'all' ? '' : activeTab} activities found
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredActivities}
          keyExtractor={item => `${item.id}-${item.type}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomColor: '#e0e0e0',
    zIndex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginLeft: 12,
    marginRight: 12,
    borderRadius: 10,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#f0f0f0',
    marginLeft: 5,
  },
  activeTabButton: {
    backgroundColor: '#29846A',
  },
  tabText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4BBC9B',
  },
  authMessage: {
    fontSize: 16,
    color: '#444',
  },
  infoText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    padding: 12,
  },
  listContainer: {
    padding: 10,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 6,
    borderRadius: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paidForMeCard: {
    backgroundColor: '#e8f7f0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeContainer: {
    marginLeft: 10,
  },
  type: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paidForMeText: {
    fontSize: 12,
    color: '#3bb0de',
    fontWeight: 'bold',
  },
  desc: {
    marginTop: 8,
    fontSize: 15,
    color: '#333',
  },
  amount: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  creator: {
    fontSize: 13,
    color: 'grey',
  },
  category: {
    fontSize: 13,
    color: '#999',
  },
  time: {
    fontSize: 12,
    color: 'grey',
    marginTop: 4,
  },
});

export default ActivityScreen;
