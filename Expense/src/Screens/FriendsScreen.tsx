import React, {useCallback, useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '../Redux/store';
import {
  fetchFriends,
  selectFriends,
  selectFriendsLoading,
  removeFriend,
  addFriend,
} from '../Redux/slice/friendslice';
import {Friend, RootStackParamList} from '../types/types';
import {
  collection,
  onSnapshot,
  doc,
  writeBatch,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import {db} from '../services/firebase';
import {
  GestureHandlerRootView,
  Swipeable,
  RectButton,
} from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';

type FriendScreenProp = StackNavigationProp<
  RootStackParamList,
  'FriendsScreen'
>;

const FriendsScreen = () => {
  const navigation = useNavigation<FriendScreenProp>();
  const dispatch = useDispatch<AppDispatch>();
  const friends = useSelector(selectFriends);
  const loading = useSelector(selectFriendsLoading);
  const [loader, setLoader] = useState(false);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const {userId} = useSelector((state: RootState) => state.auth);
  const [friendBalances, setFriendBalances] = useState<Record<string, number>>(
    {},
  );
  const [retryAttempt, setRetryAttempt] = useState(0);

  const handleAddExpense = (friend: Friend) => {
    navigation.navigate('AddFriendExpense', {friend});
  };

  const handleNavigateToChat = (friend: Friend) => {
    navigation.navigate('ChatScreenFriend', {friend});
  };

  const handleFriendRequest = () => {
    navigation.navigate('FriendRequest');
  };

  useEffect(() => {
    if (userId) {
      setLoader(true);
      dispatch(fetchFriends(userId)).then(() => {
        setLoader(false);
      });
    }
  }, [dispatch, userId]);

  const handleRetry = () => {
    setRetryAttempt(prev => prev + 1);
  };

  useEffect(() => {
    if (!userId) return;

    const unsubscribeFriends = onSnapshot(
      query(collection(db, 'friends'), where('userId', '==', userId)),
      snapshot => {
        snapshot.docChanges().forEach(change => {
          const friendData = change.doc.data() as Friend;

          if (
            change.type === 'added' &&
            !friends.some(f => f.userId === friendData.userId)
          ) {
            dispatch(addFriend(friendData));
          }
        });
      },
    );

    return () => unsubscribeFriends();
  }, [userId, dispatch, friends]);

  useEffect(() => {
    if (!userId || friends.length === 0) return;

    const calculateBalances = (friendExpenses: any[], groupExpenses: any[]) => {
      const balances: Record<string, number> = {};
      let total = 0;
      for (const friend of friends) {
        const friendId = friend.userId ?? friend.phone;
        if (!friendId || friendId === userId) continue;

        let totalBalance = 0;

        friendExpenses.forEach(expense => {
          const {paidBy, splitBetween, amount} = expense;

          if (!Array.isArray(splitBetween)) return;

          const isUserInvolved = splitBetween.includes(userId);
          const isFriendInvolved = splitBetween.includes(friendId);

          if (isUserInvolved && isFriendInvolved) {
            const share = amount / splitBetween.length;

            if (paidBy === userId) {
              totalBalance = totalBalance + share / splitBetween.length;
            } else if (paidBy === friendId) {
              totalBalance = totalBalance - share / splitBetween.length;
            }
          }
        });

        groupExpenses.forEach(expense => {
          const {paidBy, splitBetween, amount} = expense;

          if (!Array.isArray(splitBetween)) return;

          const isUserInvolved = splitBetween.includes(userId);
          const isFriendInvolved = splitBetween.includes(friendId);

          if (isUserInvolved && isFriendInvolved) {
            const share = amount / splitBetween.length;

            if (paidBy === userId) {
              totalBalance += share;
            } else if (paidBy === friendId) {
              totalBalance -= share;
            }
          }
        });

        balances[friendId] = totalBalance;
        total += totalBalance;
      }

      setFriendBalances(balances);
      setTotalBalance(total);
    };

    const unsubscribeFriendExpenses = onSnapshot(
      collection(db, 'friend_expenses'),
      snapshot => {
        const friendExpenses = snapshot.docs.map(doc => doc.data());

        onSnapshot(collection(db, 'expenses'), groupSnapshot => {
          const groupExpenses = groupSnapshot.docs.map(doc => doc.data());
          calculateBalances(friendExpenses, groupExpenses);
        });
      },
    );

    const unsubscribeGroupExpenses = onSnapshot(
      collection(db, 'expenses'),
      snapshot => {
        const groupExpenses = snapshot.docs.map(doc => doc.data());

        onSnapshot(collection(db, 'friend_expenses'), friendSnapshot => {
          const friendExpenses = friendSnapshot.docs.map(doc => doc.data());
          calculateBalances(friendExpenses, groupExpenses);
        });
      },
    );

    return () => {
      unsubscribeFriendExpenses();
      unsubscribeGroupExpenses();
    };
  }, [friends, userId]);

  const handleDeleteFriend = async (friend: Friend) => {
    if (!userId) return;

    Alert.alert(
      'Delete Friend',
      `Are you sure you want to remove ${friend.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const friendId = friend.userId ?? friend.phone;
              if (!friendId) return;

              const batch = writeBatch(db);

              const friendDocRef = doc(db, 'friends', `${userId}_${friendId}`);
              batch.delete(friendDocRef);

              const expensesRef = collection(db, 'friend_expenses');
              const q = query(
                expensesRef,
                where('splitBetween', 'array-contains', userId),
              );

              const querySnapshot = await getDocs(q);
              querySnapshot.forEach(async docSnap => {
                const expense = docSnap.data();
                if (expense.splitBetween.includes(friendId)) {
                  batch.delete(docSnap.ref);
                }
              });

              await batch.commit();

              dispatch(removeFriend(friend));
            } catch (error) {
              console.error('Deletion error:', error);
              Alert.alert(
                'Error',
                'Failed to delete friend. Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  const renderLeftActions = (friend: Friend) => {
    return (
      <View style={styles.leftActionContainer}>
        <RectButton
          style={[styles.leftAction, styles.chatAction]}
          onPress={() => handleNavigateToChat(friend)}>
          <Text style={styles.actionText}>Chat</Text>
        </RectButton>
      </View>
    );
  };

  const renderRightActions = (friend: Friend) => {
    return (
      <View style={styles.rightActionContainer}>
        <RectButton
          style={[styles.rightAction, styles.deleteAction]}
          onPress={() => handleDeleteFriend(friend)}>
          <Text style={styles.actionText}>Delete</Text>
        </RectButton>
      </View>
    );
  };

  const renderFriend = ({item}: {item: Friend}) => {
    const friendId = item.userId ?? item.phone;
    const balance = friendId ? friendBalances[friendId] ?? 0 : 0;
    const displayName = friendId === userId ? 'You' : item.name;

    return (
      <GestureHandlerRootView>
        <Swipeable
          renderLeftActions={() => renderLeftActions(item)}
          renderRightActions={() => renderRightActions(item)}
          overshootRight={false}
          overshootLeft={false}>
          <TouchableOpacity onPress={() => handleAddExpense(item)}>
            <View style={styles.friendItem}>
              <Image
                source={
                  item.photo
                    ? {uri: item.photo}
                    : require('../assets/download.png')
                }
                style={styles.friendImage}
              />
              <View style={styles.friendDetails}>
                <Text style={styles.friendName}>{displayName}</Text>
                <Text style={styles.friendPhone}>{item.phone}</Text>
                <Text
                  style={[
                    styles.friendBalance,
                    {
                      color:
                        balance < 0 ? 'red' : balance > 0 ? 'green' : 'gray',
                    },
                  ]}>
                  {balance === 0
                    ? 'Settled up'
                    : balance > 0
                    ? `Owes you ₹${balance.toFixed(2)}`
                    : `You owe ₹${Math.abs(balance).toFixed(2)}`}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </GestureHandlerRootView>
    );
  };

  const authState = useSelector((state: RootState) => state.auth);

  if (authState.loading) {
    return (
      <View style={styles.authContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.statusText}>Checking authentication...</Text>
      </View>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.errorText}>Please log in to view your friends</Text>
        <TouchableOpacity
          style={styles.buttonStyle}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Friends</Text>
        </View>

        <View style={styles.totalBalanceContainer}>
          <Text style={styles.totalBalanceText}>Total Balance</Text>
          <Text
            style={[
              styles.totalBalanceAmount,
              {
                color:
                  totalBalance < 0
                    ? 'red'
                    : totalBalance > 0
                    ? 'green'
                    : 'gray',
              },
            ]}>
            {totalBalance === 0
              ? 'Settled up'
              : totalBalance > 0
              ? `You are owed ₹${totalBalance.toFixed(2)}`
              : `You owe ₹${Math.abs(totalBalance).toFixed(2)}`}
          </Text>
        </View>

        {loader || loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CBB9B" />
            <Text style={styles.statusText}>Loading friends...</Text>
          </View>
        ) : null}

        {!loading && !loader && (!friends || friends.length === 0) && (
          <View style={styles.emptyContainer}>
            <Text style={styles.statusText}>
              No friends found. Add some friends!
            </Text>
            <TouchableOpacity
              style={styles.buttonStyle}
              onPress={handleFriendRequest}>
              <Text style={styles.buttonText}>Add a New Friend</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !loader && friends && friends.length > 0 && (
          <FlatList
            data={friends}
            keyExtractor={item =>
              item.userId ?? item.phone ?? Math.random().toString()
            }
            renderItem={renderFriend}
            style={styles.friendsList}
            contentContainerStyle={styles.friendsListContent}
          />
        )}

        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleFriendRequest}>
          <Ionicons name="add-circle-outline" size={30} color="white" />
          <Text style={styles.AddText}>Add Friend</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    padding: 12,
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
  },
  totalBalanceContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  totalBalanceText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  totalBalanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  friendsList: {
    flex: 1,
  },
  friendsListContent: {
    paddingVertical: 5,
  },
  AddText: {
    color: 'white',
    marginLeft: 4,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  friendImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 15,
    backgroundColor: '#ccc',
    borderWidth: 0.5,
    borderColor: 'grey',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#4CBB9B',
    marginBottom: 5,
  },
  friendPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  friendBalance: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#777',
  },
  rightActionContainer: {
    width: 80,
    flexDirection: 'row',
  },
  leftActionContainer: {
    width: 80,
    flexDirection: 'row',
  },
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  leftAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  deleteAction: {
    backgroundColor: '#3c7d75',
  },
  chatAction: {
    backgroundColor: '#4CBB9B',
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    padding: 10,
  },
  fabButton: {
    flexDirection: 'row',
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#4CBB9B',
    width: 120,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 10,
    color: 'red',
  },
  buttonStyle: {
    backgroundColor: '#4CBB9B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default FriendsScreen;
