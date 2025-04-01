import {getApps, initializeApp} from 'firebase/app';
import {
  getAuth,
  PhoneAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import {Platform} from 'react-native';

// Directly define Firebase config instead of using .env
const firebaseConfig = {
  apiKey:
    Platform.OS === 'ios'
      ? 'AIzaSyCIY560R83mJGCu8ili9Z523ijjLXHKjW0' // iOS API Key
      : 'AIzaSyCymkhJ9f1avJP0xk6ofBanslQrur7RLsE', // Android API Key
  authDomain: 'expense-tracker-d353d.firebaseapp.com',
  projectId: 'expense-tracker-d353d',
  storageBucket: 'expense-tracker-d353d.appspot.com',
  messagingSenderId: '341927006678',
  appId:
    Platform.OS === 'ios'
      ? '1:341927006678:ios:6932be5b8b1bed2dffd477' // iOS App ID
      : '1:341927006678:android:1d37b38f48fa7768ffd477', // Android App ID
  databaseURL: 'https://expense-tracker-d353d.firebaseio.com',
};

// Ensure Firebase initializes only once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
export {
  auth,
  db,
  PhoneAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  googleProvider,
};
