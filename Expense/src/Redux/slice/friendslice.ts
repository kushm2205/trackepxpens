import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Friend} from '../../types/types';
import {RootState} from '../store';
import {
  addDoc,
  collection,
  query,
  serverTimestamp,
  where,
  onSnapshot,
  getDocs,
  DocumentData,
  QuerySnapshot,
  doc,
  setDoc,
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

      const friendUserQuery = query(
        collection(db, 'users'),
        where('userId', '==', friendId),
      );
      const friendUserSnapshot = await getDocs(friendUserQuery);

      if (friendUserSnapshot.empty) {
        throw new Error('Friend user not found.');
      }

      const friendUserData = friendUserSnapshot.docs[0].data();
      const friendName = friendUserData.name || friend.name;
      const friendPhone = friendUserData.phone || friend.phone || '';
      const friendPhoto = friendUserData.photo || friend.photo || '';

      await setDoc(doc(db, 'friends', `${userId}_${friendId}`), {
        userId: userId,
        friendId: friendId,
        name: friendName,
        phone: friendPhone,
        photo: friendPhoto,
        createdAt: serverTimestamp(),
      });

      const currentUserQuery = query(
        collection(db, 'users'),
        where('userId', '==', userId),
      );
      const currentUserSnapshot = await getDocs(currentUserQuery);

      if (currentUserSnapshot.empty) {
        throw new Error('Current user not found.');
      }

      const currentUserData = currentUserSnapshot.docs[0].data();

      await setDoc(doc(db, 'friends', `${friendId}_${userId}`), {
        userId: friendId,
        friendId: userId,
        name: currentUserData.name || 'User',
        phone: currentUserData.phone || '',
        photo: currentUserData.photo || '',
        createdAt: serverTimestamp(),
      });

      return {
        userId: friendId,
        name: friendName,
        phone: friendPhone,
        photo: friendPhoto,
      } as Friend;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchFriends = createAsyncThunk(
  'friends/fetchFriends',
  async (userId: string, {dispatch, rejectWithValue}) => {
    try {
      if (!userId) {
        console.log('userId is null');
        return [];
      }

      const friendsQuery1 = query(
        collection(db, 'friends'),
        where('userId', '==', userId),
      );

      const friendsQuery2 = query(
        collection(db, 'friends'),
        where('friendId', '==', userId),
      );

      return new Promise<Friend[]>(async (resolve, reject) => {
        let allFriends: Friend[] = [];

        const processSnapshot = async (
          snapshot: QuerySnapshot<DocumentData, DocumentData>,
        ) => {
          const friendsList = snapshot.docs.map((docSnap: {data: () => any}) =>
            docSnap.data(),
          );

          for (const friendData of friendsList) {
            const friendId =
              friendData.userId === userId
                ? friendData.friendId
                : friendData.userId;

            try {
              const userQuery = query(
                collection(db, 'users'),
                where('userId', '==', friendId),
              );
              const userSnapshot = await getDocs(userQuery);

              if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data();
                allFriends.push({
                  userId: friendId,
                  name: userData.name,
                  phone: userData.phone,
                  photo: userData.photo,
                } as Friend);
              }
            } catch (userError) {
              console.error('Error fetching user data:', userError);
            }
          }
        };

        try {
          const snapshot1 = await getDocs(friendsQuery1);
          await processSnapshot(snapshot1);

          const snapshot2 = await getDocs(friendsQuery2);
          await processSnapshot(snapshot2);

          const uniqueFriends = allFriends.filter(
            (friend, index, self) =>
              index === self.findIndex(f => f.userId === friend.userId),
          );

          console.log('Fetched friends:', uniqueFriends);
          resolve(uniqueFriends);
        } catch (error) {
          console.error('error fetching friends:', error);
          reject(error);
        }
      });
    } catch (error: any) {
      console.error('error fetching friends:', error.message, error.code);
      return rejectWithValue(error.message || 'Error fetching friends');
    }
  },
);

const friendsSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    setFriends: (state, action: PayloadAction<Friend[]>) => {
      state.friends = action.payload;
      state.loading = false;
    },
    addFriendToState: (state, action: PayloadAction<Friend>) => {
      const exists = state.friends.some(
        friend => friend.userId === action.payload.userId,
      );
      if (!exists) {
        state.friends.push(action.payload);
      }
    },
    removeFriend: (state, action: PayloadAction<Friend>) => {
      state.friends = state.friends.filter(
        friend =>
          friend.userId !== action.payload.userId &&
          friend.phone !== action.payload.phone,
      );
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchFriends.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.loading = false;
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addFriend.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addFriend.fulfilled, (state, action: PayloadAction<Friend>) => {
        state.loading = false;
        const exists = state.friends.some(
          friend => friend.userId === action.payload.userId,
        );
        if (!exists) {
          state.friends.push(action.payload);
        }
      })
      .addCase(addFriend.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {setFriends, addFriendToState, removeFriend} =
  friendsSlice.actions;
export const selectFriends = (state: RootState) => state.friends.friends;
export const selectFriendsLoading = (state: RootState) => state.friends.loading;
export const selectFriendsError = (state: RootState) => state.friends.error;

export default friendsSlice.reducer;
