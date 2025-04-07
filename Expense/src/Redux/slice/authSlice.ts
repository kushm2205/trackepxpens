import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the auth state type
interface AuthState {
  userId: string | null;
  email: string | null;
  photoURL: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

// Load auth state from AsyncStorage
export const loadAuthState = createAsyncThunk(
  'auth/loadAuthState',
  async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const email = await AsyncStorage.getItem('email');
      const photoURL = await AsyncStorage.getItem('profilePicture');

      return {
        userId: userId ?? null,
        email: email ?? null,
        photoURL: photoURL ?? null,
        isAuthenticated: userId ? true : false,
      };
    } catch (error) {
      console.error('Error loading auth state:', error);
      return {
        userId: null,
        email: null,
        photoURL: null,
        isAuthenticated: false,
      };
    }
  },
);

const initialState: AuthState = {
  userId: null,
  email: null,
  photoURL: null,
  loading: true,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.userId = action.payload.userId;
      state.email = action.payload.email;
      state.photoURL = action.payload.photoURL;
      state.isAuthenticated = true;

      // Store minimal auth data in AsyncStorage
      AsyncStorage.setItem('userId', action.payload.userId);
      AsyncStorage.setItem('email', action.payload.email);
      if (action.payload.photoURL) {
        AsyncStorage.setItem('profilePicture', action.payload.photoURL);
      }
    },
    logout: state => {
      // Clear state
      state.userId = null;
      state.email = null;
      state.photoURL = null;
      state.isAuthenticated = false;

      // Clear AsyncStorage auth data
      AsyncStorage.removeItem('userId');
      AsyncStorage.removeItem('email');
      AsyncStorage.removeItem('profilePicture');
    },
    updateProfile: (state, action) => {
      if (action.payload.photoURL) {
        state.photoURL = action.payload.photoURL;
        AsyncStorage.setItem('profilePicture', action.payload.photoURL);
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAuthState.pending, state => {
        state.loading = true;
      })
      .addCase(loadAuthState.fulfilled, (state, action) => {
        state.userId = action.payload.userId;
        state.email = action.payload.email;
        state.photoURL = action.payload.photoURL;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.loading = false;
      })
      .addCase(loadAuthState.rejected, state => {
        state.loading = false;
        state.isAuthenticated = false;
      });
  },
});

export const {login, logout, updateProfile} = authSlice.actions;
export default authSlice.reducer;
