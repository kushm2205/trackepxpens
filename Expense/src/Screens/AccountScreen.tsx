import React, {useEffect, useState} from 'react';
import {
  View,
  TextInput,
  Button,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
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

  const groupData = useSelector((state: RootState) => state.group);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);

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
        setName(userData.name ?? '');
        setEmail(userData.email ?? '');
        setPhotoURL(userData.profilePicture ?? null);
        setPhone(userData.phone ?? '');
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
      navigation.reset({index: 0, routes: [{name: 'Login'}]});
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        <Image
          source={
            photoURL ? {uri: photoURL} : require('../assets/download.png')
          }
          style={styles.profileImage}
        />
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Name"
      />
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone"
        keyboardType="numeric"
      />
      <Button title="Update Profile" onPress={handleUpdateProfile} />
      <Button title="Logout" onPress={handleLogout} color="red" />
    </View>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    borderRadius: 5,
  },
});
