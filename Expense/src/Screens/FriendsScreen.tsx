import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View, FlatList, Image} from 'react-native';
import {RootStackParamList, Friend} from '../types/types';
import {StackNavigationProp} from '@react-navigation/stack';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {
  fetchFriends,
  selectFriends,
  selectFriendsLoading,
} from '../Redux/slice/friendslice';
import {AppDispatch, RootState} from '../Redux/store';

type FriendScreenProp = StackNavigationProp<
  RootStackParamList,
  'FriendsScreen'
>;

const FriendsScreen = () => {
  const navigation = useNavigation<FriendScreenProp>();
  const dispatch = useDispatch<AppDispatch>();
  const friends = useSelector(selectFriends);
  const loading = useSelector(selectFriendsLoading);
  const [friendBalances, setFriendBalances] = useState<Record<string, number>>(
    {},
  );
  const [newFriends, setNewFriend] = useState([]);

  const FriendRequest = () => {
    navigation.navigate('FriendRequest');
  };

  const handleAddExpense = (friend: Friend) => {
    navigation.navigate('AddFriendExpense', {friend});
  };
  const {userId} = useSelector((state: RootState) => state.auth);
  console.log('Firrne_IDDD', userId);
  useEffect(() => {
    dispatch(fetchFriends(userId));
  }, [dispatch]);

  useEffect(() => {
    if (friends) {
      setNewFriend;
    }
  }, [friends]);

  const renderFriend = ({item}: {item: Friend}) => {
    console.log('Rendering friend:', item, friends);
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
            <Text style={styles.friendName}>{item.name}</Text>
            <Text style={styles.friendPhone}>{item.phone}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return <Text style={{margin: 20}}>Loading...</Text>;
  }
  console.log(friends);
  return (
    <View style={{flex: 1}}>
      <FlatList
        data={friends}
        keyExtractor={(item, index) =>
          item.userId ?? item.phone ?? index.toString()
        }
        renderItem={renderFriend}
        ListEmptyComponent={
          <Text style={{textAlign: 'center', marginTop: 20}}>
            No friends found. Add some friends!
          </Text>
        }
      />
      <Pressable onPress={FriendRequest} style={styles.addButton}>
        <Text style={styles.addButtonText}>Add a New Friend</Text>
      </Pressable>
    </View>
  );
};

export default FriendsScreen;
const styles = StyleSheet.create({
  addButton: {
    backgroundColor: 'blue',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    margin: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendPhone: {
    color: 'gray',
  },
});
