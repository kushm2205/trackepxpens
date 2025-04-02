import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  userId: string | null;
  email: string | null;
  loading: boolean;
}

export const loadAuthState = createAsyncThunk(
  'auth/loadAuthState',
  async () => {
    const userId = await AsyncStorage.getItem('userId');
    const email = await AsyncStorage.getItem('email');

    return userId && email ? {userId, email} : {userId: null, email: null};
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {userId: null, email: null, loading: true} as AuthState,
  reducers: {
    login: (state, action) => {
      state.userId = action.payload.userId;
      state.email = action.payload.email;

      AsyncStorage.setItem('userId', action.payload.userId);
      AsyncStorage.setItem('email', action.payload.email);
    },
    logout: state => {
      state.userId = null;
      state.email = null;

      AsyncStorage.removeItem('userId');
      AsyncStorage.removeItem('email');
    },
  },
  extraReducers: builder => {
    builder.addCase(loadAuthState.fulfilled, (state, action) => {
      state.userId = action.payload.userId;
      state.email = action.payload.email;
      state.loading = false;
    });
  },
});

export const {login, logout} = authSlice.actions;
export default authSlice.reducer;
