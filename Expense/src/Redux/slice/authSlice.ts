import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the auth state type
interface AuthState {
  userId: string | null;
  email: string | null;
  photoURL: string | null; // Added to store profile picture
  loading: boolean;
}

// Load auth state from AsyncStorage
export const loadAuthState = createAsyncThunk(
  'auth/loadAuthState',
  async () => {
    const userId = await AsyncStorage.getItem('userId');
    const email = await AsyncStorage.getItem('email');
    const photoURL = await AsyncStorage.getItem('profilePicture'); // Load profile picture

    return {
      userId: userId ?? null,
      email: email ?? null,
      photoURL: photoURL ?? null,
    };
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    userId: null,
    email: null,
    photoURL: null,
    loading: true,
  } as AuthState,
  reducers: {
    login: (state, action) => {
      state.userId = action.payload.userId;
      state.email = action.payload.email;
      state.photoURL = action.payload.photoURL; // Store profile picture

      AsyncStorage.setItem('userId', action.payload.userId);
      AsyncStorage.setItem('email', action.payload.email);
      AsyncStorage.setItem('profilePicture', action.payload.photoURL);
    },
    logout: state => {
      state.userId = null;
      state.email = null;
      state.photoURL = null;

      AsyncStorage.removeItem('userId');
      AsyncStorage.removeItem('email');
      AsyncStorage.removeItem('profilePicture');
    },
  },
  extraReducers: builder => {
    builder.addCase(loadAuthState.fulfilled, (state, action) => {
      state.userId = action.payload.userId;
      state.email = action.payload.email;
      state.photoURL = action.payload.photoURL;
      state.loading = false;
    });
  },
});

export const {login, logout} = authSlice.actions;
export default authSlice.reducer;
