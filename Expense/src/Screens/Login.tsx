import React, {useState, useEffect} from 'react';
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
import {auth, signInWithEmailAndPassword} from '../services/firebase';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/types';
import {useDispatch} from 'react-redux';
import {login} from '../Redux/slice/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const Login: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [userId, setUserId] = useState('');

  const verifyEmailPassword = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      setUserId(user.uid);

      console.log('-=-=-=-=-=', user.uid);

      sendOtp();
    } catch (error) {
      Alert.alert('Error', 'Invalid email or password.');
    }
  };

  const sendOtp = async () => {
    try {
      await axios.post('http://192.168.200.167:5000/send-otp', {email});
      Alert.alert('OTP Sent', 'Check your email for the OTP.');
      setIsOtpSent(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
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
        await AsyncStorage.setItem('userId', userId);
        await AsyncStorage.setItem('email', email);

        dispatch(login({userId, email}));

        Alert.alert('Success', 'Login successful');
        navigation.navigate('Home');
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP');
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedEmail = await AsyncStorage.getItem('email');

      if (storedUserId && storedEmail) {
        dispatch(login({userId: storedUserId, email: storedEmail}));
        navigation.navigate('Home');
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <View style={styles.container}>
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

      {!isOtpSent ? (
        <Button title="Login & Get OTP" onPress={verifyEmailPassword} />
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

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Create an account</Text>
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

export default Login;
