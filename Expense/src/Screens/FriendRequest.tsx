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
  Linking,
  StyleSheet,
  ActivityIndicator,
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
import {RootState} from '../Redux/store';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

const FriendRequestScreen = ({navigation}: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contactResults, setContactResults] = useState<any[]>([]);
  const {userId} = useSelector((state: RootState) => state.auth);
  const [existingFriends, setExistingFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const requestContactPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  };

  const requestSmsPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        {
          title: 'SMS Permission',
          message: 'This app needs access to send SMS for invitations.',
          buttonPositive: 'Grant',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const normalizePhoneNumber = (phone: string) => {
    return phone.replace(/\D/g, '').slice(-10);
  };

  const sendSMSInvitation = (phoneNumber: string) => {
    const message = `Hi! I'd like to connect with you on PocketTracker. Download the app here: [App_Link]`;

    const cleanNumber = phoneNumber.replace(/\D/g, '');

    if (Platform.OS === 'android') {
      Linking.openURL(`sms:${cleanNumber}?body=${encodeURIComponent(message)}`);
    } else {
      Linking.openURL(`sms:${cleanNumber}&body=${encodeURIComponent(message)}`);
    }
  };

  const fetchContacts = async () => {
    const permission = await requestContactPermission();
    if (!permission) {
      Alert.alert(
        'Permission Denied',
        'Please enable Contacts permission in settings to use this feature.',
      );
      return;
    }

    setLoading(true);
    Contacts.getAll()
      .then(async contacts => {
        const filtered = contacts.map(contact => ({
          name: contact.displayName,
          phone: normalizePhoneNumber(contact.phoneNumbers[0]?.number || ''),
          photo: contact.thumbnailPath || '',
          isFirebaseUser: false,
        }));

        const matchedUsers = await getMatchingUsers(filtered);
        setContactResults(matchedUsers);
      })
      .catch(err => {
        console.warn('Error fetching contacts:', err);
        Alert.alert('Error', 'Could not fetch contacts.');
      })
      .finally(() => setLoading(false));
  };

  const getMatchingUsers = async (contacts: any[]) => {
    const firebaseUsersQuery = query(collection(db, 'users'));
    const firebaseUsersSnapshot = await getDocs(firebaseUsersQuery);
    const firebaseUsers = firebaseUsersSnapshot.docs.map(docSnap => ({
      userId: docSnap.id,
      name: docSnap.data().name,
      phone: normalizePhoneNumber(docSnap.data().phone),
      photo: docSnap.data().profilePicture || '',
      isFirebaseUser: true, // Mark as app user
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

  const handleAddFriend = async (friend: any) => {
    if (friend.isFirebaseUser) {
      await addFriend(friend);
    } else {
      Alert.alert(
        'Invite Friend',
        `${friend.name} is not using the app. Would you like to invite them?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Send Invite',
            onPress: async () => {
              await requestSmsPermission();
              sendSMSInvitation(friend.phone);
            },
          },
          {
            text: 'Add Anyway',
            onPress: () => addFriend(friend),
          },
        ],
      );
    }
  };

  const addFriend = async (friend: any) => {
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
    <View style={styles.contactItem}>
      <Image
        source={
          item.photo ? {uri: item.photo} : require('../assets/download.png')
        }
        style={styles.contactImage}
      />
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
        {item.isFirebaseUser ? (
          <Text style={styles.appUserBadge}>App User</Text>
        ) : (
          <Text style={styles.nonUserBadge}>Not on App</Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() => handleAddFriend(item)}
        style={styles.addButton}>
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search by name or phone"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CBB9B" />
        </View>
      ) : contactResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={80} color="gray" />
          <Text style={styles.emptyText}>No contacts found</Text>
        </View>
      ) : (
        <FlatList
          data={contactResults}
          keyExtractor={item => item.phone || item.userId}
          renderItem={renderContact}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.goBackButton}>
        <Text style={styles.goBackText}>Go to My Friends</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: 'gray',
  },
  listContainer: {
    paddingBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  contactImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appUserBadge: {
    fontSize: 12,
    color: 'white',
    backgroundColor: '#4CBB9B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  nonUserBadge: {
    fontSize: 12,
    color: 'white',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  addButton: {
    backgroundColor: '#4CBB9B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  goBackButton: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  goBackText: {
    color: '#4CBB9B',
    fontWeight: 'bold',
  },
});

export default FriendRequestScreen;
