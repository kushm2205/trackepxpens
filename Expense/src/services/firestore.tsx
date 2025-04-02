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
import {db} from './firebase';
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
