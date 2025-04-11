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
  ActivityIndicator,
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

const CreateGroup = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {users, deviceContacts, selectedMembers, searchResults, loading} =
    useSelector((state: RootState) => state.group);
  const {userId, photoURL} = useSelector((state: RootState) => state.auth);

  const navigation = useNavigation<CreateGroupProp>();

  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const currentUser = users.find(
    (user: {id: string | null}) => user.id === userId,
  );

  useEffect(() => {
    console.log('Fetching users and contacts');
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
      if (Platform.OS === 'ios') {
        try {
          const contacts = await Contacts.getAll();
          if (contacts && Array.isArray(contacts)) {
            dispatch(getDeviceContacts(contacts));
          } else {
            console.error('Contacts array is invalid:', contacts);
          }
        } catch (contactsError) {
          console.error('Error getting contacts:', contactsError);
        }
        return;
      }

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
          }
        } catch (contactsError) {
          console.error('Error getting contacts:', contactsError);
        }
      } else {
        console.log('Contacts permission denied');
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!userId) {
      return;
    }

    if (!groupName.trim()) {
      return;
    }

    if (selectedMembers.length === 0) {
      return;
    }

    setIsCreating(true);

    try {
      await dispatch(
        createNewGroup({
          groupName,
          adminUserId: userId,
          members: selectedMembers,
          groupImage: groupImage || photoURL,
        }),
      ).unwrap();

      Alert.alert('Success', 'Group created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('GroupScreen'),
        },
      ]);
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle member selection
  const handleToggleMember = (memberId: string) => {
    if (memberId) {
      dispatch(toggleMemberSelection(memberId));
    }
  };

  const handleGroupImageSelection = () => {};

  const renderCurrentUserBadge = () => {
    if (!currentUser) return null;

    return (
      <View style={styles.currentUserBadge}>
        <Image
          source={
            currentUser.profilePicture
              ? {uri: currentUser.profilePicture}
              : defaultProfileImage
          }
          style={styles.badgeImage}
        />
        <View style={styles.badgeTextContainer}>
          <Text style={styles.badgeTitle}>You (Group Admin)</Text>
          <Text style={styles.badgeSubtitle}>{currentUser.name}</Text>
        </View>
      </View>
    );
  };

  const renderContactItem = ({item}: {item: ContactItem}) => {
    if (!item) return null;

    const itemId = item.id || item.recordID || Math.random().toString();

    const displayName = item.name || item.displayName || 'Unknown';

    let phoneDisplay = 'No number';
    if (item.phone) {
      phoneDisplay = item.phone;
    } else if (item.phoneNumbers?.length > 0) {
      phoneDisplay = item.phoneNumbers[0].number;
    }

    console.log('Rendering contact:', {
      id: itemId,
      name: displayName,
      phone: phoneDisplay,
      isSelected: selectedMembers.includes(itemId),
    });

    return (
      <TouchableOpacity onPress={() => handleToggleMember(itemId)}>
        <View
          style={[
            styles.contactItem,
            selectedMembers.includes(itemId) && styles.selectedContact,
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
            <Text style={styles.contactName}>{displayName}</Text>
            <Text style={styles.contactPhone}>{phoneDisplay}</Text>
            {item.isFirebaseUser && (
              <Text style={styles.firebaseBadge}>App User</Text>
            )}
          </View>
          {selectedMembers.includes(itemId) && (
            <View style={styles.selectedIndicator}>
              <Text style={styles.selectedText}>✓</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleGroupImageSelection}>
        <Image
          source={groupImage ? {uri: groupImage} : defaultGroupImage}
          style={styles.groupImage}
        />
        <Text style={styles.changePhotoText}>Change Photo</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Group Name"
        value={groupName}
        onChangeText={setGroupName}
        style={styles.input}
      />

      {renderCurrentUserBadge()}

      <Text style={styles.sectionTitle}>Add Members</Text>
      <TextInput
        placeholder="Search contacts by name or number"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />

      {searchQuery ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            Results: {searchResults.length}
          </Text>
          <FlatList
            data={searchResults}
            renderItem={renderContactItem}
            keyExtractor={item =>
              item.id || item.recordID?.toString() || Math.random().toString()
            }
            style={styles.contactsList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No contacts found</Text>
            }
          />
        </View>
      ) : (
        <Text style={styles.hintText}>
          Start typing to search for contacts...
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.createButton,
          (!groupName.trim() || selectedMembers.length === 0 || isCreating) &&
            styles.disabledButton,
        ]}
        onPress={handleCreateGroup}
        disabled={
          !groupName.trim() || selectedMembers.length === 0 || isCreating
        }>
        {isCreating || loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>Create Group</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.memberCountText}>
        Selected members: {selectedMembers.length}
      </Text>
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
    marginBottom: 5,
    backgroundColor: '#e1e1e1',
  },
  changePhotoText: {
    textAlign: 'center',
    color: '#4285F4',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
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
    backgroundColor: '#f9f9f9',
  },
  selectedContact: {
    backgroundColor: '#e6f2ff',
  },
  contactImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#e1e1e1',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
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
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: 'white',
    fontWeight: 'bold',
  },
  hintText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
  createButton: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a0c4ff',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  memberCountText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
  currentUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  badgeImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: '#e1e1e1',
  },
  badgeTextContainer: {
    flex: 1,
  },
  badgeTitle: {
    fontWeight: 'bold',
  },
  badgeSubtitle: {
    color: '#666',
    fontSize: 12,
  },
});

export default CreateGroup;
