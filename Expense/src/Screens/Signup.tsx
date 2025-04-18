import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Image,
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

type NavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;

const Signup: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [country, setCountry] = useState('');
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    otp: '',
    country: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      otp: '',
      country: '',
    };

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }
    if (country.length <= 0) {
      newErrors.country = 'Country code is required';
      isValid = false;
    }

    if (
      !password ||
      password.length < 6 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[$&@#*%]/.test(password)
    ) {
      newErrors.password =
        'Passwords are required to contain an uppercase letter, a number, and a special character.';
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (!phone) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
      isValid = false;
    }

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

  const sendOtp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await axios.post('http://192.168.200.92:5000/api/send-otp', {email});
      Alert.alert('OTP Sent', 'Check your email for the OTP');

      setIsOtpSent(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
    } finally {
      setIsLoading(false);
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
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );
          const user = userCredential.user;

          await createUser(user.uid, name, email, phone, '', country);

          await AsyncStorage.setItem('userId', user.uid);
          await AsyncStorage.setItem('email', email);

          dispatch(login({userId: user.uid, email}));

          Alert.alert('Success', 'Account created successfully');
          navigation.navigate('Home');
        } catch (firebaseError: any) {
          let errorMessage = 'Failed to create account';
          if (firebaseError.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already in use';
          }
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };
  const renderDigitBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      boxes.push(
        <View key={i} style={styles.digitBox}>
          <Text style={styles.digitText}>{otp[i] || ''}</Text>
        </View>,
      );
    }
    return boxes;
  };

  const clearError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors({...errors, [field]: ''});
    }
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.position}>
            <Image
              source={require('../assets/pocket2.png')}
              style={styles.image}
            />
            <Text style={styles.app}> Pocket Tracker</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={text => {
              setName(text);
              clearError('name');
            }}
            style={[styles.input, errors.name ? styles.inputError : null]}
            placeholder="Enter a Name"
          />
          {errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={text => {
              setEmail(text);
              clearError('email');
            }}
            keyboardType="email-address"
            style={[styles.input, errors.email ? styles.inputError : null]}
            placeholder="Entre A Email Address"
            autoCapitalize="none"
          />
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={text => {
              setPassword(text);
              clearError('password');
            }}
            secureTextEntry
            style={[styles.input, errors.password ? styles.inputError : null]}
            placeholder="Entre a Password"
          />
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              clearError('confirmPassword');
            }}
            secureTextEntry
            style={[
              styles.input,
              errors.confirmPassword ? styles.inputError : null,
            ]}
            placeholder="Entre A Confirm Password"
          />
          {errors.confirmPassword ? (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          ) : null}

          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneView}>
            <TextInput
              value={country}
              onChangeText={text => {
                setCountry(text);
              }}
              keyboardType="phone-pad"
              style={styles.phonetext}
              placeholder="+91"
              maxLength={3}
            />
            <TextInput
              value={phone}
              onChangeText={text => {
                setPhone(text);
                clearError('phone');
              }}
              keyboardType="numeric"
              style={[
                styles.Phoneinput,
                errors.phone ? styles.inputError : null,
              ]}
              placeholder="enter a mobile number"
              maxLength={10}
            />
          </View>
          {errors.phone ? (
            <Text style={styles.errorText}>{errors.phone}</Text>
          ) : null}

          {!isOtpSent ? (
            <TouchableOpacity
              style={styles.button}
              onPress={sendOtp}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Get Verification Code</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View>
              <Text style={styles.label}>Enter OTP</Text>
              <TextInput
                value={otp}
                onChangeText={text => {
                  setOtp(text);
                  clearError('otp');
                }}
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
                  <ActivityIndicator color="#4CBB9B" />
                ) : (
                  <Text style={styles.buttonText}>
                    Verify OTP & Create Account
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    marginLeft: 20,
  },
  header: {
    backgroundColor: '#4CBB9B',
    paddingVertical: 40,
    paddingHorizontal: 40,
    paddingLeft: 10,
    marginRight: -50,
    marginTop: -40,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  position: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  app: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 25,
    textAlign: 'center',
    marginLeft: 20,
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
    width: '90%',
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
    backgroundColor: '#4CBB9B',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  body: {
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    elevation: 5,
    shadowOpacity: 0.5,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  phoneView: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 0,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },

  Phoneinput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    width: '75%',
    marginTop: 10,
  },
  phonetext: {
    fontSize: 16,
    color: '#333',
    width: '15%',
  },
  link: {
    color: '#4CBB9B',
    fontSize: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 50,
    resizeMode: 'cover',
    marginTop: 10,
  },
  otpContainer: {
    flexDirection: 'row',
  },
  digitBox: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitText: {
    fontSize: 18,
  },
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});

export default Signup;
