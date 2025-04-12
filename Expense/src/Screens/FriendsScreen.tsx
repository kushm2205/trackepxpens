import React, {useEffect, useState} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '../Redux/store';
import {
  fetchFriends,
  selectFriends,
  selectFriendsLoading,
  removeFriend,
} from '../Redux/slice/friendslice';
import {Friend, RootStackParamList} from '../types/types';
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  where,
  CollectionReference,
  DocumentData,
  QueryFieldFilterConstraint,
  DocumentReference,
  writeBatch,
  getDocs,
  query,
} from 'firebase/firestore';
import {db} from '../services/firebase';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import {RectButton} from 'react-native-gesture-handler';

type FriendScreenProp = StackNavigationProp<
  RootStackParamList,
  'FriendsScreen'
>;

const FriendsScreen = () => {
  const navigation = useNavigation<FriendScreenProp>();
  const dispatch = useDispatch<AppDispatch>();
  const friends = useSelector(selectFriends);
  const loading = useSelector(selectFriendsLoading);

  const {userId} = useSelector((state: RootState) => state.auth);
  const [friendBalances, setFriendBalances] = useState<Record<string, number>>(
    {},
  );

  const handleAddExpense = (friend: Friend) => {
    navigation.navigate('AddFriendExpense', {friend});
  };

  const FriendRequest = () => {
    navigation.navigate('FriendRequest');
  };

  useEffect(() => {
    if (userId) {
      dispatch(fetchFriends(userId));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (!userId || friends.length === 0) return;

    const calculateBalances = (friendExpenses: any[], groupExpenses: any[]) => {
      const balances: Record<string, number> = {};

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
      }

      setFriendBalances(balances);
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
  const renderRightActions = (friend: Friend) => {
    return (
      <RectButton
        style={styles.deleteButton}
        onPress={() => handleDeleteFriend(friend)}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </RectButton>
    );
  };

  const renderFriend = ({item}: {item: Friend}) => {
    const friendId = item.userId ?? item.phone;
    const balance = friendId ? friendBalances[friendId] ?? 0 : 0;
    const displayName = friendId === userId ? 'You' : item.name;

    return (
      <Swipeable renderRightActions={() => renderRightActions(item)}>
        <Pressable onPress={() => handleAddExpense(item)}>
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
                    color: balance < 0 ? 'red' : balance > 0 ? 'green' : 'gray',
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
        </Pressable>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={{marginTop: 20}}
        />
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item, index) =>
            item.userId ?? item.phone ?? index.toString()
          }
          renderItem={renderFriend}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No friends found. Add some friends!
            </Text>
          }
        />
      )}

      <Pressable onPress={FriendRequest} style={styles.addButton}>
        <Text style={styles.addButtonText}>Add a New Friend</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendPhone: {
    fontSize: 14,
    color: '#555',
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
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default FriendsScreen;
