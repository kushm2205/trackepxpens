import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View, FlatList, Image} from 'react-native';
import {RootStackParamList, Friend} from '../types/types';
import {StackNavigationProp} from '@react-navigation/stack';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import {collection, getDocs, query, where} from 'firebase/firestore';
import {db} from '../services/firestore';

type FriendScreenProp = StackNavigationProp<
  RootStackParamList,
  'FriendsScreen'
>;

const FriendsScreen = () => {
  const navigation = useNavigation<FriendScreenProp>();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = auth().currentUser?.uid;

  const FriendRequest = () => {
    navigation.navigate('FriendRequest');
  };

  useEffect(() => {
    const fetchFriends = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const friendsQuery = query(
          collection(db, 'friends'),
          where('userId', '==', userId),
        );
        const snapshot = await getDocs(friendsQuery);
        const friendsList = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            userId: data.friendId,
            name: data.name,
            phone: data.phone,
            photo: data.photo,
          } as Friend;
        });
        setFriends(friendsList);
      } catch (error) {
        console.error('Error fetching friends from Firestore:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [userId]);

  if (loading) {
    return <Text style={{margin: 20}}>Loading...</Text>;
  }

  const renderFriend = ({item}: {item: Friend}) => (
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
  );

  return (
    <View style={{flex: 1}}>
      <FlatList
        data={friends}
        keyExtractor={item => item.userId || item.phone}
        renderItem={renderFriend}
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
