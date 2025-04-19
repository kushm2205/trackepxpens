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
  Modal,
  ScrollView,
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
// Default group images
const groupImage1 = require('../assets/family.jpeg');
const groupImage2 = require('../assets/food.jpeg');
const groupImage3 = require('../assets/friend.jpeg');
const groupImage4 = require('../assets/home.jpeg');
const groupImage5 = require('../assets/money.jpeg');
const groupImage6 = require('../assets/other.png');
const groupImage7 = require('../assets/travel.jpeg');
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
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  const groupImages = [
    {id: 'default', source: defaultProfileImage},
    {id: 'group1', source: groupImage1},
    {id: 'group2', source: groupImage2},
    {id: 'group3', source: groupImage3},
    {id: 'group4', source: groupImage4},
    {id: 'group5', source: groupImage5},
    {id: 'group6', source: groupImage6},
    {id: 'group7', source: groupImage7},
  ];

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
      );

      Alert.alert('Success', 'Group created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsCreating(false);
    }
  };
  const handleToggleMember = (memberId: string) => {
    if (memberId) {
      dispatch(toggleMemberSelection(memberId));
    }
  };

  const handleGroupImageSelection = () => {
    setImagePickerVisible(true);
  };

  const selectImage = (imageUri: string) => {
    setGroupImage(imageUri);
    setImagePickerVisible(false);
  };

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

  const renderImagePickerModal = () => {
    return (
      <Modal
        visible={imagePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImagePickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Group Image</Text>
            <ScrollView horizontal={true} style={styles.imageScroller}>
              {groupImages.map(img => (
                <TouchableOpacity
                  key={img.id}
                  style={styles.imageOption}
                  onPress={() =>
                    selectImage(Image.resolveAssetSource(img.source).uri)
                  }>
                  <Image source={img.source} style={styles.previewImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setImagePickerVisible(false)}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleGroupImageSelection}
        style={styles.imageContainer}>
        <Image
          source={groupImage ? {uri: groupImage} : defaultProfileImage}
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

      {renderImagePickerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  groupImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e1e1e1',
  },
  changePhotoText: {
    textAlign: 'center',
    color: '#4CBB9B',
    marginTop: 5,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4CBB9B',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 14,
    color: '#4CBB9B',
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
    borderRadius: 20,
    marginBottom: 5,
    backgroundColor: '#E5E5E5',
  },
  selectedContact: {
    backgroundColor: '#33FFFF',
  },
  contactImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'grey',
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
    backgroundColor: '#4CBB9B',
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
    backgroundColor: '#4CBB9B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: 'white',
    fontWeight: 'bold',
  },
  hintText: {
    textAlign: 'center',
    color: 'grey',
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: 'red',
    marginVertical: 20,
  },
  createButton: {
    backgroundColor: '#4CBB7c',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#4CBB9B',
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
    backgroundColor: '#33FFFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  badgeImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: 'grey',
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: 'grey',
  },
  imageScroller: {
    flexGrow: 0,
    marginBottom: 20,
  },
  imageOption: {
    marginRight: 15,
    alignItems: 'center',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#grey',
  },

  closeButton: {
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#33FFFF',
  },
  closeButtonText: {
    color: 'grey',
    fontWeight: '500',
  },
});

export default CreateGroup;
