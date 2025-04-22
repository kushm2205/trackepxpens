import {
  collection,
  getDocs,
  query,
  where,
} from '@react-native-firebase/firestore';
import {db} from '../services/firebase';

export const calculateFriendBalance = async (
  userId: string,
  friendId: string,
) => {
  let balance = 0;

  try {
    const groupExpensesSnap = await getDocs(
      query(
        collection(db, 'expenses'),
        where('splitBetween', 'array-contains', userId),
      ),
    );

    groupExpensesSnap.forEach((docSnap: {data: () => any}) => {
      const expense = docSnap.data();
      const isFriendInvolved = expense.splitBetween.includes(friendId);
      if (isFriendInvolved) {
        const share = expense.amount / expense.splitBetween.length;
        if (expense.paidBy === userId) {
          balance += share; // friend owes user
        } else if (expense.paidBy === friendId) {
          balance -= share; // user owes friend
        }
      }
    });

    const friendExpensesSnap = await getDocs(
      query(
        collection(db, 'friend_expenses'),
        where('friendId', '==', friendId),
      ),
    );

    friendExpensesSnap.forEach((docSnap: {data: () => any}) => {
      const expense = docSnap.data();
      if (expense.paidBy === userId) {
        balance += expense.amount / expense.splitBetween.length;
      } else if (expense.paidBy === friendId) {
        balance -= expense.amount / expense.splitBetween.length;
      }
    });

    return balance;
  } catch (error) {
    console.error('Error calculating balance:', error);
    return 0;
  }
};
