import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  TextInput,
  Modal,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Text,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState, AppDispatch} from '../Redux/store';
import {logout, login} from '../Redux/slice/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {auth} from '../services/firebase';
import {signOut} from 'firebase/auth';
import {StackNavigationProp} from '@react-navigation/stack';
import {useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../types/types';
import {uploadImage, getUser, updateUser} from '../services/firestore';
import {launchImageLibrary} from 'react-native-image-picker';

type AccountScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Account'
>;

const AccountScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<AccountScreenNavigationProp>();
  const {userId} = useSelector((state: RootState) => state.auth);
  const modalAnimation = useRef(new Animated.Value(0)).current;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [currentField, setCurrentField] = useState<
    'name' | 'email' | 'phone' | null
  >(null);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  useEffect(() => {
    if (isModalVisible) {
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isModalVisible]);

  const fetchUserData = async () => {
    if (!userId) return;

    try {
      const userData = await getUser(userId);
      if (userData) {
        setName(userData.name ?? '');
        setEmail(userData.email ?? '');
        setPhotoURL(userData.profilePicture ?? null);
        setPhone(userData.phone ?? '');
        setTermsAccepted(userData.termsAccepted ?? false);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const pickImage = async () => {
    try {
      launchImageLibrary({mediaType: 'photo'}, async response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', 'Failed to pick an image.');
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          if (asset.uri) {
            setPhotoURL(asset.uri);
            try {
              if (userId) {
                const uploadResult = await uploadImage(asset.uri, userId);
                if (uploadResult) {
                  setPhotoURL(uploadResult.cloudinaryUrl);
                  await updateUser(userId, {
                    profilePicture: uploadResult.cloudinaryUrl,
                  });
                  await AsyncStorage.setItem(
                    'profilePicture',
                    uploadResult.cloudinaryUrl,
                  );
                }
              }
            } catch (error) {
              console.error('Error uploading image:', error);
              Alert.alert('Error', 'Failed to upload profile picture.');
            }
          }
        }
      });
    } catch (error) {
      console.error('Error selecting image: ', error);
    }
  };

  const openEditModal = (field: 'name' | 'email' | 'phone') => {
    setCurrentField(field);
    switch (field) {
      case 'name':
        setEditName(name);
        break;
      case 'email':
        setEditEmail(email);
        break;
      case 'phone':
        setEditPhone(phone);
        break;
    }
    setIsModalVisible(true);
  };

  const saveFieldEdit = async () => {
    if (!userId || !currentField) return;

    let updatedValue = '';
    switch (currentField) {
      case 'name':
        if (!editName.trim()) {
          Alert.alert('Error', 'Name cannot be empty');
          return;
        }
        updatedValue = editName;
        setName(editName);
        break;
      case 'email':
        if (!editEmail.trim() || !editEmail.includes('@')) {
          Alert.alert('Error', 'Please enter a valid email');
          return;
        }
        updatedValue = editEmail;
        setEmail(editEmail);
        break;
      case 'phone':
        if (!editPhone.trim()) {
          Alert.alert('Error', 'Phone number cannot be empty');
          return;
        }
        updatedValue = editPhone;
        setPhone(editPhone);
        break;
    }

    try {
      const updateObj = {[currentField]: updatedValue};
      await updateUser(userId, updateObj);

      if (currentField === 'email') {
        dispatch(login({userId, email: updatedValue, photoURL}));
      }

      setIsModalVisible(false);
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userId) return;

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      await updateUser(userId, {
        name,
        email,
        phone,
        profilePicture: photoURL ?? '',
        termsAccepted,
      });

      dispatch(login({userId, email, photoURL}));
      await AsyncStorage.setItem('profilePicture', photoURL ?? '');

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.clear();
      dispatch(logout());
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const renderEditModal = () => {
    return (
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  {
                    translateY: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit{' '}
                {currentField
                  ? currentField.charAt(0).toUpperCase() + currentField.slice(1)
                  : ''}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {currentField === 'name' && (
                <TextInput
                  style={styles.modalInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                  autoFocus
                />
              )}

              {currentField === 'email' && (
                <TextInput
                  style={styles.modalInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoFocus
                />
              )}

              {currentField === 'phone' && (
                <TextInput
                  style={styles.modalInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  autoFocus
                />
              )}

              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveFieldEdit}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Account</Text>
        </View>

        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={pickImage}
            style={styles.profileImageContainer}>
            <Image
              source={
                photoURL ? {uri: photoURL} : require('../assets/download.png')
              }
              style={styles.profileImage}
            />
            <View style={styles.cameraIconContainer}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{name || 'Your Name'}</Text>
          <Text style={styles.userEmail}>{email || 'email@example.com'}</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <TouchableOpacity
            style={styles.fieldContainer}
            onPress={() => openEditModal('name')}>
            <View style={styles.fieldLabelContainer}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <Text style={styles.fieldValue}>{name || 'Not set'}</Text>
            </View>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fieldContainer}
            onPress={() => openEditModal('email')}>
            <View style={styles.fieldLabelContainer}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <Text style={styles.fieldValue}>{email || 'Not set'}</Text>
            </View>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fieldContainer}
            onPress={() => openEditModal('phone')}>
            <View style={styles.fieldLabelContainer}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <Text style={styles.fieldValue}>{phone || 'Not set'}</Text>
            </View>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdateProfile}>
            <Text style={styles.updateButtonText}>Update Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 YourAppName. All rights reserved. By using this app, you
            agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>

      {renderEditModal()}
    </View>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  header: {
    borderRadius: 0,
    padding: 16,
    backgroundColor: '#29846A',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileSection: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 10,
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginHorizontal: 15,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#29846A',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#29846A',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  cameraIcon: {
    fontSize: 18,
    color: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333333',
  },
  userEmail: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
  },
  formSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333333',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    paddingBottom: 10,
  },
  fieldContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  fieldLabelContainer: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#555555',
    fontWeight: '500',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333333',
  },
  editIcon: {
    fontSize: 18,
    marginLeft: 10,
  },
  termsContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 15,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#555555',
  },
  buttonContainer: {
    flexDirection: 'column',
    padding: 20,
    marginHorizontal: 15,
    marginTop: 20,
  },
  updateButton: {
    backgroundColor: '#29846A',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '30%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    fontSize: 22,
    color: '#666666',
  },
  modalContent: {
    flex: 1,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#f2f2f2',
  },
  cancelButtonText: {
    color: '#555555',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#29846A',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
