import React, {useState, useEffect} from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Contacts from 'react-native-contacts';
import {useDispatch, useSelector} from 'react-redux';
import {
  fetchUsers,
  getDeviceContacts,
  toggleMemberSelection,
  createNewGroup,
  searchContactsAndUsers,
  clearSearchResults,
} from '../Redux/slice/GroupSlice';
import {RootState, AppDispatch} from '../Redux/store';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {useNavigation} from '@react-navigation/native';

const defaultProfileImage = require('../assets/download.png');
const defaultGroupImage = require('../assets/download.png');

type CreateGroupProp = StackNavigationProp<RootStackParamList, 'CreateGroup'>;

interface ContactItem {
  id?: string;
  recordID?: string;
  name?: string;
  displayName?: string;
  phone?: string;
  phoneNumbers?: Array<{number: string; label?: string}>;
  profilePicture?: string | null;
  isFirebaseUser?: boolean;
}

const CreateGroup = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {users, deviceContacts, selectedMembers, searchResults, loading} =
    useSelector((state: RootState) => state.Group);
  const {userId} = useSelector((state: RootState) => state.auth);

  const navigation = useNavigation<CreateGroupProp>();

  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchUsers());
    requestContactsPermission();
  }, [dispatch]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      dispatch(clearSearchResults());
      return;
    }

    const timeoutId = setTimeout(() => {
      dispatch(
        searchContactsAndUsers({
          query: searchQuery,
          users,
          deviceContacts,
        }),
      );
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, users, deviceContacts, dispatch]);

  const requestContactsPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Permission',
          message: 'This app needs access to your contacts.',
          buttonPositive: 'Grant',
          buttonNegative: 'Deny',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Contacts permission granted');
        try {
          const contacts = await Contacts.getAll();
          if (contacts && Array.isArray(contacts)) {
            dispatch(getDeviceContacts(contacts));
          } else {
            console.error('Contacts array is invalid:', contacts);
            Alert.alert(
              'Error',
              'Failed to retrieve contacts. Please try again.',
            );
          }
        } catch (contactsError) {
          console.error('Error getting contacts:', contactsError);
          Alert.alert(
            'Error',
            'Failed to retrieve contacts. Please try again.',
          );
        }
      } else {
        console.log('Contacts permission denied');
        Alert.alert(
          'Permission Denied',
          'You need to grant contacts permission to use this feature.',
        );
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      Alert.alert('Error', 'An error occurred while requesting permissions.');
    }
  };

  // Handle creating group
  const handleCreateGroup = async () => {
    if (!userId) {
      console.error('User ID is missing');
      return;
    }

    try {
      await dispatch(
        createNewGroup({
          groupName,
          adminUserId: userId,
          members: selectedMembers,
          groupImage,
        }),
      ).unwrap();

      navigation.navigate('GroupScreen');
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  // Handle member selection
  const handleToggleMember = (memberId: string) => {
    dispatch(toggleMemberSelection(memberId));
  };

  // Handle group image selection
  const handleGroupImageSelection = () => {
    // Replace with actual image picker logic
    setGroupImage('path/to/selected/image.jpg');
  };

  const renderContactItem = ({item}: {item: ContactItem}) => (
    <TouchableOpacity
      onPress={() => handleToggleMember(item.id || item.recordID || '')}>
      <View
        style={[
          styles.contactItem,
          selectedMembers.includes(item.id || item.recordID || '') &&
            styles.selectedContact,
        ]}>
        <Image
          source={
            item.profilePicture
              ? {uri: item.profilePicture}
              : defaultProfileImage
          }
          style={styles.contactImage}
        />
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>
            {item.name || item.displayName || 'Unknown'}
          </Text>
          <Text style={styles.contactPhone}>
            {item.phone || item.phoneNumbers?.[0]?.number || 'No number'}
          </Text>
          {item.isFirebaseUser && (
            <Text style={styles.firebaseBadge}>Firebase User</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleGroupImageSelection}>
        <Image
          source={groupImage ? {uri: groupImage} : defaultGroupImage}
          style={styles.groupImage}
        />
      </TouchableOpacity>

      <TextInput
        placeholder="Group Name"
        value={groupName}
        onChangeText={setGroupName}
        style={styles.input}
      />

      <TextInput
        placeholder="Search contacts by name or number"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />

      {searchQuery ? (
        <FlatList
          data={searchResults}
          renderItem={renderContactItem}
          keyExtractor={item =>
            item.id || item.recordID?.toString() || Math.random().toString()
          }
          style={styles.contactsList}
        />
      ) : (
        <Text style={styles.hintText}>
          Start typing to search for contacts...
        </Text>
      )}

      <Button
        title={loading ? 'Creating...' : 'Create Group'}
        onPress={handleCreateGroup}
        disabled={loading || !groupName || selectedMembers.length === 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  groupImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  contactsList: {
    flex: 1,
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  selectedContact: {
    backgroundColor: '#e6f2ff',
  },
  contactImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  firebaseBadge: {
    fontSize: 12,
    color: 'white',
    backgroundColor: '#4285F4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  hintText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
});

export default CreateGroup;
