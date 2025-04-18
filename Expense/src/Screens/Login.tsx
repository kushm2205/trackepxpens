import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import {
  auth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from '../services/firebase';
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
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    otp: '',
  });

  // Validation function
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      email: '',
      password: '',
      otp: '',
    };

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // OTP validation (only if OTP is sent)
    if (isOtpSent && !otp) {
      newErrors.otp = 'OTP is required';
      isValid = false;
    } else if (isOtpSent && otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const verifyEmailPassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      setUserId(user.uid);

      console.log('User authenticated:', user.uid);

      sendOtp();
    } catch (error: any) {
      let errorMessage = 'Invalid email or password.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid password.';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async () => {
    try {
      await axios.post('http://192.168.200.92:5000/api/send-otp', {email});
      Alert.alert('OTP Sent', 'Check your email for the OTP.');
      setIsOtpSent(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
    }
  };

  const verifyOtp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(
        'http://192.168.200.92:5000/api/verify-otp',
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrors({
        ...errors,
        email: 'Please enter your email to reset password',
      });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({...errors, email: 'Please enter a valid email'});
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password Reset',
        'Password reset link has been sent to your email.',
      );
    } catch (error: any) {
      let errorMessage = 'Failed to send password reset email.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
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

  // Clear errors when user types
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors({...errors, email: ''});
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) {
      setErrors({...errors, password: ''});
    }
  };

  const handleOtpChange = (text: string) => {
    setOtp(text);
    if (errors.otp) {
      setErrors({...errors, otp: ''});
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={handleEmailChange}
        keyboardType="email-address"
        style={[styles.input, errors.email ? styles.inputError : null]}
        placeholder="your@email.com"
        autoCapitalize="none"
      />
      {errors.email ? (
        <Text style={styles.errorText}>{errors.email}</Text>
      ) : null}

      <Text style={styles.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={handlePasswordChange}
        secureTextEntry
        style={[styles.input, errors.password ? styles.inputError : null]}
        placeholder="******"
      />
      {errors.password ? (
        <Text style={styles.errorText}>{errors.password}</Text>
      ) : null}

      <TouchableOpacity
        style={styles.forgotPassword}
        onPress={handleForgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      {!isOtpSent ? (
        <TouchableOpacity
          style={styles.button}
          onPress={verifyEmailPassword}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login & Get OTP</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <Text style={styles.label}>Enter OTP</Text>
          <TextInput
            value={otp}
            onChangeText={handleOtpChange}
            keyboardType="numeric"
            style={[styles.input, errors.otp ? styles.inputError : null]}
            placeholder="123456"
            maxLength={6}
          />
          {errors.otp ? (
            <Text style={styles.errorText}>{errors.otp}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.button}
            onPress={verifyOtp}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.linkContainer}
        onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  link: {
    color: '#4285F4',
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  forgotPasswordText: {
    color: '#4285F4',
    fontSize: 14,
  },
});

export default Login;
