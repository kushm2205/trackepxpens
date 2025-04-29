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
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import {db, storage, ref, uploadBytes, getDownloadURL} from './firebase';
import {Platform} from 'react-native';
import {Friend} from '../types/types';

export const createUser = async (
  userId: string,
  name: string,
  email: string,
  phone: string,
  profilePicture: string,
  countrycode: string,
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
        countrycode,
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
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: string;
    termsAccepted: boolean;
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
      name: `image_${Date.now()}.jpg`,
      type: 'image/jpeg',
    });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const cloudinaryResponse = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });

    const cloudinaryData = await cloudinaryResponse.json();

    if (!cloudinaryResponse.ok || !cloudinaryData.secure_url) {
      console.error(await cloudinaryResponse.text());
      throw new Error('Cloudinary upload failed');
    }

    const imageUrl = cloudinaryData.secure_url;
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {profilePicture: imageUrl}, {merge: true});

    return {cloudinaryUrl: imageUrl};
  } catch (error) {
    console.error(' Image upload error:', error);
    return null;
  }
};

export const addFriend = async (
  friend: Friend,
  userId: string | undefined,
  existingFriends: string[],
  setExistingFriends: React.Dispatch<React.SetStateAction<string[]>>,
): Promise<void> => {
  if (!userId) {
    console.error('User ID is undefined.');
    return;
  }

  const friendId = friend.userId || friend.phone;

  if (!friendId) {
    console.error('Friend ID could not be determined.');
    return;
  }

  if (existingFriends.includes(friendId)) {
    console.log(`Friend with ID ${friendId} already exists.`);
    return;
  }

  try {
    await addDoc(collection(db, 'friends'), {
      userId: userId,
      friendId: friendId,
      name: friend.name,
      phone: friend.phone,
      photo: friend.photo,
      createdAt: serverTimestamp(),
    });

    setExistingFriends(prev => [...prev, friendId]);
    console.log(`Friend with ID ${friendId} added successfully.`);
  } catch (error) {
    console.error('Error adding friend to Firestore:', error);
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
    if (!groupId || !paidBy || amount <= 0 || splitBetween.length === 0) {
      throw new Error('Invalid expense parameters');
    }

    if (!splitBetween.includes(paidBy)) {
      splitBetween = [...splitBetween];
    }

    const expenseData = {
      groupId,
      paidBy,
      amount: Number(amount),
      splitBetween,
      description,
      createdAt: serverTimestamp(),
      settled: false,
    };

    const expenseRef = await addDoc(collection(db, 'expenses'), expenseData);

    await updateDoc(doc(db, 'groups', groupId), {
      lastActivity: serverTimestamp(),
    });

    return expenseRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw new Error(`Failed to add expense: ${error}`);
  }
};
export const addFriendExpense = async (
  paidBy: string,
  amount: number,
  splitBetween: string[],
  description: string,
  friendId: string,
): Promise<string> => {
  try {
    const currentUserId = splitBetween.find(id => id !== friendId);

    if (!currentUserId) {
      throw new Error('Current user not found in splitBetween array');
    }

    const expenseData1 = {
      paidBy,
      amount,
      splitBetween,
      description,
      friendId,
      createdAt: serverTimestamp(),
      settled: false,
    };

    const expenseData2 = {
      paidBy,
      amount,
      splitBetween,
      description,
      friendId: currentUserId,
      createdAt: serverTimestamp(),
      settled: false,
    };

    const docRef1 = await addDoc(
      collection(db, 'friend_expenses'),
      expenseData1,
    );
    await addDoc(collection(db, 'friend_expenses'), expenseData2);

    console.log("Added expense for both users' views");
    return docRef1.id;
  } catch (error) {
    console.error('Error adding friend expense:', error);
    throw new Error('Failed to add expense');
  }
};

export const deleteGroupFromFirestore = async (groupId: string) => {
  try {
    const batch = writeBatch(db);

    batch.delete(doc(db, 'groups', groupId));

    const expensesQuery = query(
      collection(db, 'expenses'),
      where('groupId', '==', groupId),
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    expensesSnapshot.forEach(expenseDoc => {
      batch.delete(expenseDoc.ref);
    });

    const messagesQuery = query(collection(db, 'groups', groupId, 'messages'));
    const messagesSnapshot = await getDocs(messagesQuery);
    messagesSnapshot.forEach(messageDoc => {
      batch.delete(messageDoc.ref);
    });

    await batch.commit();

    console.log(`Group ${groupId} and all related data deleted successfully`);
    return true;
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};
export const addPersonalExpenseToFirestore = async (
  userId: string,
  amount: number,
  category: string,
  description: string,
  date: Date,
) => {
  try {
    const expenseData = {
      userId,
      amount,
      category,
      description,
      date,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, 'personal_expenses'),
      expenseData,
    );
    console.log('Personal expense added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding personal expense:', error);
    throw error;
  }
};

export const getPersonalExpenses = async (userId: string) => {
  try {
    const expensesQuery = query(
      collection(db, 'personal_expenses'),
      where('userId', '==', userId),
    );

    const snapshot = await getDocs(expensesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching personal expenses:', error);
    throw error;
  }
};

export const deletePersonalExpense = async (expenseId: string) => {
  try {
    await deleteDoc(doc(db, 'personal_expenses', expenseId));
    console.log('Personal expense deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting personal expense:', error);
    throw error;
  }
};
export {db};
