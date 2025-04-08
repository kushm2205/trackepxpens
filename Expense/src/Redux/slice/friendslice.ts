// store/slices/friendsSlice.ts
import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Friend} from '../../types/types';
import {RootState} from '../store';
import auth from '@react-native-firebase/auth';
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import {db} from '../../services/firestore';

interface FriendsState {
  friends: Friend[];
  loading: boolean;
  error: string | null;
}

const initialState: FriendsState = {
  friends: [],
  loading: false,
  error: null,
};

export const addFriend = createAsyncThunk(
  'friends/addFriend',
  async (
    {friend, userId}: {friend: Friend; userId: string},
    {rejectWithValue, getState},
  ) => {
    try {
      const friendId = friend.userId || friend.phone;
      if (!friendId) {
        throw new Error('Friend ID could not be determined.');
      }

      const state = getState() as RootState;
      const exists = state.friends.friends.some(
        f => f.userId === friendId || f.phone === friend.phone,
      );
      if (exists) {
        throw new Error('Friend already exists');
      }

      await addDoc(collection(db, 'friends'), {
        userId: userId,
        friendId: friendId,
        name: friend.name,
        phone: friend.phone,
        photo: friend.photo,
        createdAt: serverTimestamp(),
      });

      return friend;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add friend');
    }
  },
);

export const fetchFriends = createAsyncThunk(
  'friends/fetchFriends',
  async (_, {rejectWithValue}) => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        return [];
      }

      const friendsQuery = query(
        collection(db, 'friends'),
        where('userId', '==', userId),
      );
      const snapshot = await getDocs(friendsQuery);
      const friendsList = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          userId: data.friendId,
          name: data.name,
          phone: data.phone,
          photo: data.photo,
        } as Friend;
      });
      return friendsList;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error fetching friends');
    }
  },
);

const friendsSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      // Fetch friends cases
      .addCase(fetchFriends.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchFriends.fulfilled,
        (state, action: PayloadAction<Friend[]>) => {
          state.loading = false;
          state.friends = action.payload;
        },
      )
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Add friend cases
      .addCase(addFriend.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addFriend.fulfilled, (state, action: PayloadAction<Friend>) => {
        state.loading = false;
        state.friends.push(action.payload);
      })
      .addCase(addFriend.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const selectFriends = (state: RootState) => state.friends.friends;
export const selectFriendsLoading = (state: RootState) => state.friends.loading;
export const selectFriendsError = (state: RootState) => state.friends.error;

export default friendsSlice.reducer;
