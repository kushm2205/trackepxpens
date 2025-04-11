import React, {useEffect, useState} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '../Redux/store';
import {
  fetchFriends,
  selectFriends,
  selectFriendsLoading,
} from '../Redux/slice/friendslice';
import {Friend, RootStackParamList} from '../types/types';
import {collection, getDocs} from 'firebase/firestore';
import {db} from '../services/firebase';

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
    const calculateBalances = async () => {
      try {
        const balances: Record<string, number> = {};

        // Get all expenses at once to reduce repetitive Firebase reads
        const friendExpenseSnapshot = await getDocs(
          collection(db, 'friend_expenses'),
        );
        const groupExpenseSnapshot = await getDocs(collection(db, 'expenses'));

        for (const friend of friends) {
          const friendId = friend.userId ?? friend.phone;
          if (!friendId || friendId === userId) continue;

          let totalBalance = 0;

          // --- Friend Expenses (1-on-1) ---
          friendExpenseSnapshot.forEach(doc => {
            const data = doc.data();
            const {paidBy, splitBetween, amount} = data;

            if (!Array.isArray(splitBetween) || typeof amount !== 'number')
              return;

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

          // --- Group Expenses ---
          groupExpenseSnapshot.forEach(doc => {
            const data = doc.data();
            const {paidBy, splitBetween, amount} = data;

            if (!Array.isArray(splitBetween) || typeof amount !== 'number')
              return;

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
      } catch (error) {
        console.error('Error calculating balances:', error);
      }
    };

    if (friends.length > 0 && userId) {
      calculateBalances();
    }

    if (friends.length > 0 && userId) {
      calculateBalances();
    }
  }, [friends, userId]);

  const renderFriend = ({item}: {item: Friend}) => {
    const friendId = item.userId ?? item.phone;
    const balance = friendId ? friendBalances[friendId] ?? 0 : 0;
    const displayName = friendId === userId ? 'You' : item.name;

    return (
      <Pressable onPress={() => handleAddExpense(item)}>
        <View style={styles.friendItem}>
          <Image
            source={
              item.photo ? {uri: item.photo} : require('../assets/download.png')
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

export default FriendsScreen;

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
});
