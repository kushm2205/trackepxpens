import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const Login: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      email: '',
      password: '',
    };

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await AsyncStorage.setItem('userId', user.uid);
      await AsyncStorage.setItem('email', email);

      dispatch(login({userId: user.uid, email}));
    } catch (error: any) {
      let errorMessage = 'Invalid email or password.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage =
          'Too many failed attempts. Account temporarily disabled.';
      }
      Alert.alert('Error', errorMessage);
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

  return (
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
        <Text style={styles.title}>Welcome Back</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={handleEmailChange}
          keyboardType="email-address"
          style={[styles.input, errors.email ? styles.inputError : null]}
          placeholder="Enter your email"
          autoCapitalize="none"
        />
        {errors.email ? (
          <Text style={styles.errorText}>{errors.email}</Text>
        ) : null}
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWithIcon}>
          <TextInput
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry={!showPassword}
            placeholder="Enter your password"
            style={styles.textInput}
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>
        {errors.password ? (
          <Text style={styles.errorText}>{errors.password}</Text>
        ) : null}

        {errors.password ? (
          <Text style={styles.errorText}>{errors.password}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={handleForgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>

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
  PassPosition: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#4CBB9B',
    fontSize: 16,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    width: '90%',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: '#000',
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
  image: {
    width: 80,
    height: 80,
    borderRadius: 50,
    resizeMode: 'cover',
    marginTop: 10,
  },
  position: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  body: {
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    elevation: 5,
    shadowOpacity: 0.5,
    marginTop: 50,
  },
  forgotPasswordText: {
    color: '#4CBB9B',
    fontSize: 14,
  },
});

export default Login;
