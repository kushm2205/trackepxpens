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
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  getFirestore,
  setDoc,
  doc,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import {getStorage, ref, uploadBytes, getDownloadURL} from 'firebase/storage';

const firebaseConfig = {
  apiKey:
    Platform.OS === 'ios'
      ? 'AIzaSyDVOW3tdI9aeUTsTwWeHKW_YpwQv0C7OLw'
      : 'AIzaSyC_1zSM9CCHHGBjND7elDlW1GDM9BUsvnQ',
  authDomain: 'expenss-fc1b4.firebaseapp.com',
  projectId: 'expenss-fc1b4',
  storageBucket: 'expenss-fc1b4.firebasestorage.app',
  messagingSenderId: '341927006678',
  appId:
    Platform.OS === 'ios'
      ? '1:270497481638:ios:de810f698609c54ea50567'
      : '1:270497481638:android:f5de1b3f6509f4f0a50567',
  databaseURL: 'https://expenss-fc1b4.firebaseio.com',
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
enableIndexedDbPersistence(db).catch(err => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.log('Persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // The current browser doesn't support persistence
    console.log('Persistence not supported by browser');
  }
});
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
  sendPasswordResetEmail,
  setDoc,
  doc,
};
