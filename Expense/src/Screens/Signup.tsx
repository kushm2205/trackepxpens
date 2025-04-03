import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import {auth, createUserWithEmailAndPassword} from '../services/firebase';
import {createUser} from '../services/firestore';
import {useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../types/types';
import {useDispatch} from 'react-redux';
import {login} from '../Redux/slice/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {StackNavigationProp} from '@react-navigation/stack';

// Define navigation type
type NavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;

const Signup: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [phone, setPhone] = useState('');

  const sendOtp = async () => {
    try {
      await axios.post('http://192.168.200.167:5000/send-otp', {email});
      Alert.alert('OTP Sent', 'Check your email for the OTP');
      console.log('executed');
      setIsOtpSent(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
      console.log(error);
    }
  };

  const verifyOtp = async () => {
    try {
      const response = await axios.post(
        'http://192.168.200.167:5000/verify-otp',
        {
          email,
          otp: Number(otp),
        },
      );

      if (response.status === 200) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = userCredential.user;

        await createUser(user.uid, name, email, phone, '');

        await AsyncStorage.setItem('userId', user.uid);
        await AsyncStorage.setItem('email', email);

        dispatch(login({userId: user.uid, email}));

        Alert.alert('Success', 'Account created successfully');
        navigation.navigate('Home');
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Text style={styles.label}>Number</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        keyboardType="numeric"
        style={styles.input}
      />

      {!isOtpSent ? (
        <Button title="Get Verification Code" onPress={sendOtp} />
      ) : (
        <>
          <Text style={styles.label}>Enter OTP</Text>
          <TextInput
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            style={styles.input}
          />
          <Button title="Verify OTP" onPress={verifyOtp} />
        </>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {padding: 20},
  label: {fontSize: 16, fontWeight: 'bold', marginBottom: 5},
  input: {
    borderBottomWidth: 1,
    marginBottom: 10,
    fontSize: 16,
    paddingVertical: 5,
  },
  link: {color: 'blue', marginTop: 10, textAlign: 'center'},
});

export default Signup;
