import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import {db, storage, ref, uploadBytes, getDownloadURL} from './firebase';
import {Platform} from 'react-native';
//create a new user in a firestore
export const createUser = async (
  userId: string,
  name: string,
  email: string,
  phone: string,
  profilePicture: string,
) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        userId,
        name,
        email,
        phone,
        profilePicture,
        createdAt: serverTimestamp(),
      },
      {merge: true},
    );

    console.log('User created successfully');
  } catch (error) {
    console.error('Error creating user:', error);
  }
};

export const createGroup = async (
  groupName: string,
  createdBy: string,
  members: string[],
  imageUrl: any,
) => {
  try {
    const groupRef = await addDoc(collection(db, 'groups'), {
      groupName,
      createdBy,
      members,
      createdAt: serverTimestamp(),
    });

    console.log('Group created successfully with ID:', groupRef.id);
    return groupRef.id;
  } catch (error) {
    console.error('Error creating group:', error);
    return null;
  }
};

export const addExpense = async (
  groupId: string,
  paidBy: string,
  amount: number,
  splitBetween: string[],
  description: string,
) => {
  try {
    const expenseRef = await addDoc(collection(db, 'expenses'), {
      groupId,
      paidBy,
      amount,
      splitBetween,
      description,
      createdAt: serverTimestamp(),
    });

    console.log('✅ Expense added successfully with ID:', expenseRef.id);
    return expenseRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    return null;
  }
};

export const getUserBalance = async (userId: string) => {
  try {
    const balancesRef = collection(db, 'balances');
    const balanceQuery = query(balancesRef, where('fromUser', '==', userId));

    const snapshot = await getDocs(balanceQuery);
    const balances = snapshot.docs.map(docs => docs.data());

    return balances;
  } catch (error) {
    console.error('Error getting user balance:', error);
    return [];
  }
};

export const getUser = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.log(' User not found');
      return null;
    }

    console.log('User data:', userSnap.data());
    return userSnap.data();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export const updateUser = async (
  userId: string,
  updatedFields: Partial<{
    name: string;
    email: string;
    phone: string;
    profilePicture: string;
  }>,
) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updatedFields);
    console.log('User updated successfully');
  } catch (error) {
    console.error('Error updating user:', error);
  }
};

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dqx2mxtys/upload';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';
export const uploadImage = async (uri: string, userId: string) => {
  try {
    const imageUri =
      Platform.OS === 'android' ? uri : uri.replace('file://', '');

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: `image_${Date.now()}.jpg`, // Give a unique name
      type: 'image/jpeg', // Ensure the correct type
    });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    // ✅ Upload to Cloudinary
    const cloudinaryResponse = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });

    const cloudinaryData = await cloudinaryResponse.json();

    if (!cloudinaryResponse.ok || !cloudinaryData.secure_url) {
      console.error(
        '❌ Cloudinary Upload Failed:',
        await cloudinaryResponse.text(),
      );
      throw new Error('Cloudinary upload failed');
    }

    const imageUrl = cloudinaryData.secure_url;
    console.log('✅ Cloudinary Upload URL:', imageUrl);

    // ✅ Store Cloudinary URL in Firestore
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {profilePicture: imageUrl}, {merge: true});

    console.log('✅ Cloudinary URL saved to Firestore');

    return {cloudinaryUrl: imageUrl};
  } catch (error) {
    console.error('❌ Image upload error:', error);
    return null;
  }
};

export {db};
