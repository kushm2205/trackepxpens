import React, {useState} from 'react';
import {View, Text, TextInput, Button, Alert} from 'react-native';
import {sendOtp} from '../auth/twilo';
import {auth, db} from '../services/firebase';
import {collection, addDoc} from 'firebase/firestore';

const Signup = ({navigation}: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleSendOtp = async () => {
    if (!name || !email || !phone) {
      Alert.alert('Error', 'All fields are required!');
      return;
    }

    try {
      const response = await sendOtp(phone);
      setVerificationCode(response.otp);
      setIsOtpSent(true);
      Alert.alert('Success', 'OTP Sent Successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP.');
    }
  };

  // Verify OTP and Register User
  const handleVerifyOtp = async () => {
    if (otp !== verificationCode) {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
      return;
    }

    try {
      await addDoc(collection(db, 'users'), {
        name,
        email,
        phone,
        createdAt: new Date(),
      });

      Alert.alert('Success', 'User registered successfully!');
      navigation.navigate('Dashboard'); // Navigate to Dashboard after signup
    } catch (error) {
      Alert.alert('Error', 'Failed to register user.');
      console.error(error);
    }
  };

  return (
    <View style={{padding: 20}}>
      <Text>Name</Text>
      <TextInput
        placeholder="Enter Name"
        value={name}
        onChangeText={setName}
        style={{borderBottomWidth: 1, marginBottom: 10}}
      />

      <Text>Email</Text>
      <TextInput
        placeholder="Enter Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={{borderBottomWidth: 1, marginBottom: 10}}
      />

      <Text>Phone Number</Text>
      <TextInput
        placeholder="Enter Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={{borderBottomWidth: 1, marginBottom: 10}}
      />

      {!isOtpSent && <Button title="Send OTP" onPress={handleSendOtp} />}

      {isOtpSent && (
        <View>
          <Text>Enter OTP</Text>
          <TextInput
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            style={{borderBottomWidth: 1, marginBottom: 10}}
          />
          <Button title="Verify OTP & Register" onPress={handleVerifyOtp} />
        </View>
      )}

      <Button
        title="Already have an account? Login"
        onPress={() => navigation.navigate('Login')}
      />
    </View>
  );
};

export default Signup;
