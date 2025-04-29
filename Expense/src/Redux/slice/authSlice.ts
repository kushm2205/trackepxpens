import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthState} from '../../types/types';
import firestore from '@react-native-firebase/firestore';
export interface LoggedInUser {
  userId: string | null;
  email: string | null;
  photoURL: string | null;
}
export const loadAuthState = createAsyncThunk(
  'auth/loadAuthState',
  async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const email = await AsyncStorage.getItem('email');
      const photoURL = await AsyncStorage.getItem('profilePicture');

      console.log('Loading auth state - userId:', userId);
      if (userId) {
        const userDoc = await firestore().collection('users').doc(userId).get();

        return {
          userId,
          email,
          photoURL,
          isAuthenticated: true,
        };
      }
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

const saveAuthData = async (
  userId: string | null,
  email: string | null,
  photoURL: string | null,
) => {
  try {
    if (userId) {
      await AsyncStorage.setItem('userId', userId);
      console.log('Saved userId to AsyncStorage:', userId);
    } else {
      await AsyncStorage.removeItem('userId');
    }

    if (email) {
      await AsyncStorage.setItem('email', email);
    } else {
      await AsyncStorage.removeItem('email');
    }

    if (photoURL) {
      await AsyncStorage.setItem('profilePicture', photoURL);
    } else {
      await AsyncStorage.removeItem('profilePicture');
    }
  } catch (error) {
    console.error('Error saving auth data:', error);
  }
};

const initialState: AuthState = {
  userId: null,
  email: null,
  photoURL: null,
  loading: true,
  isAuthenticated: false,
  photo: '',
  phone: '',
  name: '',
  auth: undefined,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      if (!action.payload.userId) {
        console.error('Attempted login without userId');
        return;
      }

      state.userId = action.payload.userId;
      state.email = action.payload.email;
      state.photoURL = action.payload.photoURL;
      state.isAuthenticated = true;

      saveAuthData(
        action.payload.userId,
        action.payload.email,
        action.payload.photoURL,
      );
    },

    logout: state => {
      state.userId = null;
      state.email = null;
      state.photoURL = null;
      state.isAuthenticated = false;
      state.subscription = undefined;

      saveAuthData(null, null, null);
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
