import {Platform} from 'react-native';
import {initializeApp, getApps} from 'firebase/app';
import {
  getAuth,
  PhoneAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import {getFirestore, setDoc, doc} from 'firebase/firestore';
import {getStorage, ref, uploadBytes, getDownloadURL} from 'firebase/storage';

const firebaseConfig = {
  apiKey:
    Platform.OS === 'ios'
      ? 'AIzaSyCIY560R83mJGCu8ili9Z523ijjLXHKjW0'
      : 'AIzaSyCymkhJ9f1avJP0xk6ofBanslQrur7RLsE',
  authDomain: 'expense-tracker-d353d.firebaseapp.com',
  projectId: 'expense-tracker-d353d',
  storageBucket: 'expense-tracker-d353d.appspot.com',
  messagingSenderId: '341927006678',
  appId:
    Platform.OS === 'ios'
      ? '1:341927006678:ios:6932be5b8b1bed2dffd477'
      : '1:341927006678:android:1d37b38f48fa7768ffd477',
  databaseURL: 'https://expense-tracker-d353d.firebaseio.com',
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  db,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  PhoneAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  googleProvider,
  setDoc,
  doc,
};
