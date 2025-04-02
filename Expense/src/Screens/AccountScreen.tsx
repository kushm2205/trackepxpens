import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
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
import {auth, db} from '../services/firebase';
import {doc, getDoc, updateDoc} from 'firebase/firestore';
import {launchImageLibrary} from 'react-native-image-picker';
import {signOut} from 'firebase/auth';
import {StackNavigationProp} from '@react-navigation/stack';
import {useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../types/types';

type AccountScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Account'
>;

const AccountScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<AccountScreenNavigationProp>();
  const {userId} = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    if (!userId) return;

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        setName(userData?.name?.trim() ?? '');
        setEmail(userData?.email?.trim() ?? '');
        setPhotoURL(userData?.profilePicture?.trim() ?? null);
      } else {
        setName('');
        setEmail('');
        setPhotoURL(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setName('');
      setEmail('');
      setPhotoURL(null);
    }
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({mediaType: 'photo'});
    if (!result.didCancel && result.assets && result.assets.length > 0) {
      setPhotoURL(result.assets[0].uri ?? null);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userId) return;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        name,
        email,
        profilePicture: photoURL ?? '',
      });

      dispatch(login({userId, email}));
      await AsyncStorage.setItem('email', email);

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('email');

      dispatch(logout());

      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{name: 'Login'}],
        });
      });
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
      <Button title="Update Profile" onPress={handleUpdateProfile} />
      <Button title="Logout" onPress={handleLogout} color="red" />
    </View>
  );
};

export default AccountScreen;

// Styles
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
