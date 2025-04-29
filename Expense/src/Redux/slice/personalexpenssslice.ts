import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {db} from '../../services/firebase';

export interface PersonalExpense {
  id?: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: Timestamp;
  createdAt?: Timestamp;
}

interface IExpenseInputData {
  userId: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
}

interface PersonalExpensesState {
  expenses: PersonalExpense[];
  loading: boolean;
  error: string | null;
}

const initialState: PersonalExpensesState = {
  expenses: [],
  loading: false,
  error: null,
};

export const addPersonalExpense = createAsyncThunk<
  PersonalExpense,
  IExpenseInputData,
  {rejectValue: string}
>('personalExpenses/add', async (expenseData, {rejectWithValue}) => {
  try {
    const expenseToAdd = {
      userId: expenseData.userId,
      amount: expenseData.amount,
      description: expenseData.description,
      category: expenseData.category,
      date: Timestamp.fromDate(expenseData.date),
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, 'personal_expenses'),
      expenseToAdd,
    );

    return {
      id: docRef.id,
      ...expenseToAdd,

      createdAt: Timestamp.now(),
    } as PersonalExpense;
  } catch (error) {
    console.error('Error adding personal expense:', error);
    return rejectWithValue('Failed to add expense');
  }
});

export const fetchPersonalExpenses = createAsyncThunk<
  PersonalExpense[],
  string,
  {rejectValue: string}
>('personalExpenses/fetch', async (userId, {rejectWithValue}) => {
  try {
    const expensesQuery = query(
      collection(db, 'personal_expenses'),
      where('userId', '==', userId),
    );

    const snapshot = await getDocs(expensesQuery);
    const expenses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date,
        createdAt: data.createdAt,
      } as PersonalExpense;
    });

    return expenses;
  } catch (error) {
    console.error('Error fetching personal expenses:', error);
    return rejectWithValue('Failed to fetch expenses');
  }
});

const personalExpensesSlice = createSlice({
  name: 'personalExpenses',
  initialState,
  reducers: {
    clearPersonalExpenses: state => {
      state.expenses = [];
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(addPersonalExpense.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        addPersonalExpense.fulfilled,
        (state, action: PayloadAction<PersonalExpense>) => {
          state.loading = false;
          state.expenses.push(action.payload);
        },
      )
      .addCase(addPersonalExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchPersonalExpenses.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPersonalExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchPersonalExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {clearPersonalExpenses} = personalExpensesSlice.actions;
export default personalExpensesSlice.reducer;
