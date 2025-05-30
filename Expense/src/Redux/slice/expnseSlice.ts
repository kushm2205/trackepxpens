import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {addFriendExpense} from '../../services/firestore';

interface FriendExpense {
  friendId: string;
  paidBy: string;
  amount: number;
  splitBetween: string[];
  description: string;
  createdAt: any;
  settled: boolean;
}

interface FriendExpensesState {
  friendExpenses: FriendExpense[];
  loading: boolean;
  error: string | null;
}

const initialState: FriendExpensesState = {
  friendExpenses: [],
  loading: false,
  error: null,
};
export const addFriendExpenseThunk = createAsyncThunk(
  'friendExpenses/addFriendExpense',
  async (
    {
      paidBy,
      amount,
      splitBetween,
      description,
      friendId,
    }: Omit<FriendExpense, 'createdAt' | 'settled'>,
    {rejectWithValue},
  ) => {
    try {
      const expenseId = await addFriendExpense(
        paidBy,
        amount,
        splitBetween,
        description,
        friendId,
      );

      const newExpense: FriendExpense = {
        friendId,
        paidBy,
        amount,
        splitBetween,
        description,
        createdAt: new Date(),
        settled: false,
      };

      return {...newExpense, expenseId};
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add friend expense');
    }
  },
);
const friendExpensesSlice = createSlice({
  name: 'friendExpenses',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(addFriendExpenseThunk.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        addFriendExpenseThunk.fulfilled,
        (state, action: PayloadAction<FriendExpense & {expenseId: string}>) => {
          state.loading = false;
          state.friendExpenses.push(action.payload);
        },
      )
      .addCase(addFriendExpenseThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default friendExpensesSlice.reducer;
