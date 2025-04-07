import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import Contacts from 'react-native-contacts';
import auth from '@react-native-firebase/auth';
import {
  collection,
  query,
  getDocs,
  doc,
  setDoc,
  getDoc,
  where,
} from 'firebase/firestore';
import {db} from '../services/firestore';

const FriendRequestScreen = ({navigation}: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contactResults, setContactResults] = useState<any[]>([]);
  const userId = auth().currentUser?.uid;
  const [existingFriends, setExistingFriends] = useState<string[]>([]);

  const requestContactPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const normalizePhoneNumber = (phone: string) => {
    return phone.replace(/\D/g, '').slice(-10);
  };

  const fetchContacts = async () => {
    const permission = await requestContactPermission();
    if (!permission) return;

    Contacts.getAll()
      .then(async contacts => {
        const filtered = contacts.map(contact => ({
          name: contact.displayName,
          phone: normalizePhoneNumber(contact.phoneNumbers[0]?.number || ''),
          photo: contact.thumbnailPath || '',
        }));

        const matchedUsers = await getMatchingUsers(filtered);
        setContactResults(matchedUsers);
      })
      .catch(err => console.warn('Error fetching contacts:', err));
  };

  const getMatchingUsers = async (contacts: any[]) => {
    const firebaseUsersQuery = query(collection(db, 'users'));
    const firebaseUsersSnapshot = await getDocs(firebaseUsersQuery);
    const firebaseUsers = firebaseUsersSnapshot.docs.map(docSnap => ({
      userId: docSnap.id,
      name: docSnap.data().name,
      phone: normalizePhoneNumber(docSnap.data().phone),
      photo: docSnap.data().profilePicture || '',
    }));

    const results: any[] = [];

    firebaseUsers.forEach(firebaseUser => {
      if (
        firebaseUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        firebaseUser.phone.includes(searchQuery)
      ) {
        results.push(firebaseUser);
      }
    });

    contacts.forEach(contact => {
      if (
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone.includes(searchQuery)
      ) {
        const alreadyInFirebase = results.some(
          user => user.phone === contact.phone,
        );
        if (!alreadyInFirebase) {
          results.push(contact);
        }
      }
    });

    return results;
  };

  const addFriend = async (friend: any) => {
    if (!userId) return;

    const friendId = friend.userId || friend.phone;

    if (existingFriends.includes(friendId)) {
      Alert.alert(
        'Already Friend',
        'This user is already in your friend list.',
      );
      return;
    }

    try {
      const friendDocRef = doc(db, 'friends', `${userId}_${friendId}`);
      const friendDoc = await getDoc(friendDocRef);

      if (friendDoc.exists()) {
        Alert.alert('Already Friend', 'Friend already added.');
        return;
      }

      await setDoc(friendDocRef, {
        userId,
        friendId,
        name: friend.name,
        phone: friend.phone,
        photo: friend.photo || '',
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Friend added successfully!');
      setExistingFriends(prev => [...prev, friendId]);
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'Failed to add friend.');
    }
  };

  const fetchExistingFriends = async () => {
    if (!userId) return;

    try {
      const friendsQuery = query(
        collection(db, 'friends'),
        where('userId', '==', userId),
      );
      const snapshot = await getDocs(friendsQuery);
      const friendIds = snapshot.docs.map(docSnap => docSnap.data().friendId);
      setExistingFriends(friendIds);
    } catch (error) {
      console.error('Error fetching existing friends:', error);
    }
  };

  useEffect(() => {
    fetchExistingFriends();
  }, [userId]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      fetchContacts();
    } else {
      setContactResults([]);
    }
  }, [searchQuery]);

  const renderContact = ({item}: any) => (
    <View style={{flexDirection: 'row', alignItems: 'center', padding: 10}}>
      <Image
        source={
          item.photo ? {uri: item.photo} : require('../assets/download.png')
        }
        style={{width: 40, height: 40, borderRadius: 20, marginRight: 10}}
      />
      <View style={{flex: 1}}>
        <Text>{item.name}</Text>
        <Text style={{color: 'gray'}}>{item.phone}</Text>
      </View>
      <TouchableOpacity onPress={() => addFriend(item)}>
        <Text style={{color: 'blue'}}>Add Friend</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{flex: 1, padding: 20}}>
      <TextInput
        placeholder="Search by name or phone"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          paddingHorizontal: 10,
          marginBottom: 20,
        }}
      />
      <FlatList
        data={contactResults}
        keyExtractor={item => item.phone || item.userId}
        renderItem={renderContact}
      />
      <TouchableOpacity
        onPress={() => navigation.navigate('FriendsScreen')}
        style={{marginTop: 20, alignItems: 'center'}}>
        <Text style={{color: 'green'}}>Go to My Friends</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FriendRequestScreen;
