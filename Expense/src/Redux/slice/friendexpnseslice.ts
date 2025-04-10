import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Expense} from '../../types/types';
import {RootState} from '../store';
import {addDoc, collection, getDocs, query, where} from 'firebase/firestore';
import {db} from '../../services/firestore';

interface ExpensesState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
}

const initialState: ExpensesState = {
  expenses: [],
  loading: false,
  error: null,
};

export const addExpense = createAsyncThunk(
  'expenses/addExpense',
  async (expenseData: Omit<Expense, 'id' | 'settled'>, {rejectWithValue}) => {
    try {
      const expenseRef = await addDoc(collection(db, 'expenses'), {
        ...expenseData,
        settled: false,
      });
      return {id: expenseRef.id, ...expenseData, settled: false} as Expense;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to add expense',
      );
    }
  },
);

export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (friendId: string, {rejectWithValue, getState}) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.userId;

      if (!userId) {
        return [];
      }

      const q = query(
        collection(db, 'expenses'),
        where('splitBetween', 'array-contains', userId),
        where('friendId', '==', friendId),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch expenses',
      );
    }
  },
);

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(addExpense.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        addExpense.fulfilled,
        (state, action: PayloadAction<Expense>) => {
          state.loading = false;
          state.expenses.push(action.payload);
        },
      )
      .addCase(addExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchExpenses.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchExpenses.fulfilled,
        (state, action: PayloadAction<Expense[]>) => {
          state.loading = false;
          state.expenses = action.payload;
        },
      )
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const selectExpenses = (state: RootState) => state.expenses.expenses;
export const selectExpensesLoading = (state: RootState) =>
  state.expenses.loading;
export const selectExpensesError = (state: RootState) => state.expenses.error;

export default expensesSlice.reducer;
