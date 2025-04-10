import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {db} from './firebase';

export const addExpense = async (expenseData: {
  amount: number;
  description: string;
  paidBy: string;
  splitBetween: string[];
  createdAt: string;
  friendId: string;
}) => {
  try {
    if (!expenseData.amount || expenseData.amount <= 0) {
      throw new Error('Invalid amount');
    }

    const expenseRef = await addDoc(collection(db, 'expenses'), {
      ...expenseData,
      settled: false,
    });

    // Update both users' balances
    const splitAmount = expenseData.amount / expenseData.splitBetween.length;

    if (expenseData.paidBy === expenseData.splitBetween[0]) {
      // User paid, friend owes
      await updateBalances(
        expenseData.paidBy,
        expenseData.splitBetween[1],
        splitAmount,
      );
    } else {
      // Friend paid, user owes
      await updateBalances(
        expenseData.paidBy,
        expenseData.splitBetween[0],
        splitAmount,
      );
    }

    return expenseRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

const updateBalances = async (paidBy: string, owes: string, amount: number) => {
  const balanceRef = doc(db, 'balances', `${paidBy}_${owes}`);
  const docSnap = await getDoc(balanceRef);

  if (docSnap.exists()) {
    await updateDoc(balanceRef, {
      amount: increment(amount),
    });
  } else {
    await setDoc(balanceRef, {
      fromUser: owes,
      toUser: paidBy,
      amount: amount,
    });
  }
};
