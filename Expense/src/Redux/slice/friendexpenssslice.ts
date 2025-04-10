// Redux/slice/friendExpenseSlice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Friend} from '../../types/types';

interface FriendExpenseState {
  photoURL: string | null;
  description: string;
  amount: string;
  paidBy: 'you' | 'friend';
  splitOption: 'you' | 'friend' | 'both';
  selectedFriend: Friend | null; // Add this
}

const initialState: FriendExpenseState = {
  photoURL: null,
  description: '',
  amount: '',
  paidBy: 'you',
  splitOption: 'both',
  selectedFriend: null, // Add this
};

const friendExpenseSlice = createSlice({
  name: 'friendExpense',
  initialState,
  reducers: {
    setSelectedFriend(state, action: PayloadAction<Friend>) {
      state.selectedFriend = action.payload;
      state.photoURL = action.payload.photo || null;
    },
    updatePhoto(state, action: PayloadAction<string | null>) {
      state.photoURL = action.payload;
    },
    updateDescription(state, action: PayloadAction<string>) {
      state.description = action.payload;
    },
    updateAmount(state, action: PayloadAction<string>) {
      state.amount = action.payload;
    },
    updatePaidBy(state, action: PayloadAction<'you' | 'friend'>) {
      state.paidBy = action.payload;
    },
    updateSplitOption(state, action: PayloadAction<'you' | 'friend' | 'both'>) {
      state.splitOption = action.payload;
    },
    resetExpense(state) {
      state.description = '';
      state.amount = '';
      state.paidBy = 'you';
      state.splitOption = 'both';
    },
  },
});

export const {
  updatePhoto,
  updateDescription,
  updateAmount,
  updatePaidBy,
  updateSplitOption,
  resetExpense,
} = friendExpenseSlice.actions;

export default friendExpenseSlice.reducer;
