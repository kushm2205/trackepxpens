import React, {useEffect, useState} from 'react';
import {
  View,
  TextInput,
  Button,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Text,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Switch,
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

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  // Bank details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountType, setAccountType] = useState('Savings');
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  // Terms and conditions
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Section visibility
  const [showPersonalDetails, setShowPersonalDetails] = useState(true);
  const [showBankDetails, setShowBankDetails] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    if (!userId) return;

    try {
      const userData = await getUser(userId);
      if (userData) {
        // Personal details
        setName(userData.name ?? '');
        setEmail(userData.email ?? '');
        setPhotoURL(userData.profilePicture ?? null);
        setPhone(userData.phone ?? '');

        // Bank details
        setBankName(userData.bankName ?? '');
        setAccountNumber(userData.accountNumber ?? '');
        setIfscCode(userData.ifscCode ?? '');
        setAccountType(userData.accountType ?? '');
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
          }
        }
      });
    } catch (error) {
      console.error('Error selecting image: ', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userId) return;

    // Basic validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (
      showBankDetails &&
      (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim())
    ) {
      Alert.alert('Error', 'Please fill all bank details');
      return;
    }

    if (!termsAccepted) {
      Alert.alert('Error', 'Please accept the terms and conditions');
      return;
    }

    try {
      let uploadedPhotoURL = photoURL;

      if (photoURL && photoURL.startsWith('file://')) {
        const uploadResult = await uploadImage(photoURL, userId);

        if (!uploadResult) {
          Alert.alert('Upload Failed', 'Image upload was unsuccessful.');
          return;
        }
        uploadedPhotoURL = uploadResult.cloudinaryUrl;
        setPhotoURL(uploadedPhotoURL);
      }

      await updateUser(userId, {
        name,
        email,
        phone,
        profilePicture: uploadedPhotoURL ?? '',
        bankName,
        accountNumber,
        ifscCode,
        accountType,
        termsAccepted,
      });

      dispatch(login({userId, email, photoURL: uploadedPhotoURL}));
      await AsyncStorage.setItem('profilePicture', uploadedPhotoURL ?? '');

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
      // navigation.reset({index: 0, routes: [{name: 'Login'}]});
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const toggleAccountNumberVisibility = () => {
    setShowAccountNumber(!showAccountNumber);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Account</Text>
        </View>

        {/* Profile Section */}
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

        {/* Section Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, showPersonalDetails && styles.activeTab]}
            onPress={() => {
              setShowPersonalDetails(true);
              setShowBankDetails(false);
            }}>
            <Text
              style={[
                styles.tabText,
                showPersonalDetails && styles.activeTabText,
              ]}>
              Personal Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, showBankDetails && styles.activeTab]}
            onPress={() => {
              setShowPersonalDetails(false);
              setShowBankDetails(true);
            }}>
            <Text
              style={[styles.tabText, showBankDetails && styles.activeTabText]}>
              Bank Details
            </Text>
          </TouchableOpacity>
        </View>

        {/* Personal Details Section */}
        {showPersonalDetails && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {/* Bank Details Section */}
        {showBankDetails && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Bank Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <TextInput
                style={styles.input}
                value={bankName}
                onChangeText={setBankName}
                placeholder="Enter your bank name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="Enter account number"
                  keyboardType="numeric"
                  secureTextEntry={!showAccountNumber}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={toggleAccountNumberVisibility}>
                  <Text style={styles.eyeIconText}>
                    {showAccountNumber ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>IFSC Code</Text>
              <TextInput
                style={styles.input}
                value={ifscCode}
                onChangeText={setIfscCode}
                placeholder="Enter IFSC code"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Type</Text>
              <View style={styles.accountTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.accountTypeButton,
                    accountType === 'Savings' && styles.selectedAccountType,
                  ]}
                  onPress={() => setAccountType('Savings')}>
                  <Text
                    style={[
                      styles.accountTypeText,
                      accountType === 'Savings' &&
                        styles.selectedAccountTypeText,
                    ]}>
                    Savings
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.accountTypeButton,
                    accountType === 'Current' && styles.selectedAccountType,
                  ]}
                  onPress={() => setAccountType('Current')}>
                  <Text
                    style={[
                      styles.accountTypeText,
                      accountType === 'Current' &&
                        styles.selectedAccountTypeText,
                    ]}>
                    Current
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Terms and Conditions */}
        <View style={styles.termsContainer}>
          <View style={styles.termsRow}>
            <Switch
              value={termsAccepted}
              onValueChange={setTermsAccepted}
              trackColor={{false: '#d3d3d3', true: '#4CAF50'}}
              thumbColor={termsAccepted ? '#ffffff' : '#f4f3f4'}
            />
            <Text style={styles.termsText}>
              I accept the terms and conditions
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
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

        {/* Copyright/Terms Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 YourAppName. All rights reserved. By using this app, you
            agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    padding: 20,
    backgroundColor: '#4a90e2',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4a90e2',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4a90e2',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4a90e2',
  },
  tabText: {
    fontSize: 16,
    color: '#777777',
  },
  activeTabText: {
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  formSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333333',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555555',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  passwordContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  eyeIconText: {
    fontSize: 20,
  },
  accountTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accountTypeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  selectedAccountType: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  accountTypeText: {
    fontSize: 16,
    color: '#555555',
  },
  selectedAccountTypeText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  termsContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 10,
    borderRadius: 10,
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
    fontSize: 14,
    color: '#555555',
  },
  buttonContainer: {
    flexDirection: 'column',
    padding: 20,
    marginHorizontal: 15,
  },
  updateButton: {
    backgroundColor: '#4a90e2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
});
