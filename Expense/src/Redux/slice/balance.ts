import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {db} from '../../services/firestore';
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

interface Balance {
  fromUser: string;
  toUser: string;
  amount: number;
}

export const updateBalance = createAsyncThunk(
  'balances/update',
  async (balances: Balance[], {rejectWithValue}) => {
    try {
      for (const bal of balances) {
        const q = query(
          collection(db, 'balances'),
          where('fromUser', '==', bal.fromUser),
          where('toUser', '==', bal.toUser),
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;
          const existing = snapshot.docs[0].data().amount || 0;
          await updateDoc(docRef, {amount: existing + bal.amount});
        } else {
          await setDoc(doc(collection(db, 'balances')), bal);
        }
      }
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

const balanceSlice = createSlice({
  name: 'balances',
  initialState: [],
  reducers: {},
  extraReducers: builder => {
    builder.addCase(updateBalance.fulfilled, (state, action) => {
      console.log('Balance updated successfully');
    });
  },
});

export default balanceSlice.reducer;
