import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface UserState {
  uid: string;
  name: string;
  email: string;
}

const initialState: UserState = {
  uid: '',
  name: '',
  email: '',
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      state.uid = action.payload.uid;
      state.name = action.payload.name;
      state.email = action.payload.email;
    },
    clearUser: () => initialState,
  },
});

export const {setUser, clearUser} = userSlice.actions;
export default userSlice.reducer;
