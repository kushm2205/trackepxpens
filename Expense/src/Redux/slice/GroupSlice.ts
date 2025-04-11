import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {auth, db} from '../../services/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  where,
  query,
} from 'firebase/firestore';
import {RootState} from '../store';
import {addExpense as addExpenseToFirestore} from '../../services/firestore';
import {
  DeviceContact,
  FirebaseUser,
  Contact,
  PhoneNumber,
  group,
  AddExpensePayload,
  CreateGroupPayload,
} from '../../types/types';
import {linkWithRedirect} from 'firebase/auth';
import {ThemeContext, ThemeProvider} from '@react-navigation/native';
import {calculateShares} from '../../utils/Expenssutils';

export const fetchGroups = createAsyncThunk<
  group[],
  string | void,
  {rejectValue: string}
>('group/fetchGroups', async (userId, {rejectWithValue}) => {
  try {
    console.log('Starting fetchGroups...');
    const currentUser = auth.currentUser;
    const userIdToUse = userId || currentUser?.uid;

    console.log('Using userId for query:', userIdToUse);
    if (!userIdToUse) {
      console.log('No user ID available to query groups');
      return rejectWithValue('User not authenticated');
    }

    const groupsQuery = query(
      collection(db, 'groups'),
      where('members', 'array-contains', userIdToUse),
    );

    console.log('Executing Firestore query...');
    const groupsSnapshot = await getDocs(groupsQuery);
    console.log(`Query returned ${groupsSnapshot.docs.length} documents`);

    const groupsList = await Promise.all(
      groupsSnapshot.docs.map(async doc => {
        const groupData = doc.data();
        const membersCount = groupData.members ? groupData.members.length : 0;
        console.log(
          `Processing group: ${doc.id}, name: ${groupData.groupName}`,
        );

        return {
          id: doc.id,
          ...groupData,
          membersCount,
          groupImageUrl: groupData.groupImage || null,
        } as group;
      }),
    );

    console.log(`Returning ${groupsList.length} groups`);
    return groupsList;
  } catch (error) {
    console.error('Error fetching groups:', error);
    return rejectWithValue(
      `Failed to fetch groups: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
});
export const fetchUsers = createAsyncThunk<
  FirebaseUser[],
  void,
  {rejectValue: string}
>('group/fetchUsers', async (_, {rejectWithValue}) => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersList = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unknown',
        phone: data.phone || '',
        profilePicture: data.profilePicture || null,
        isFirebaseUser: true,
      } as FirebaseUser;
    });
    console.log('fetch user', usersList);
    return usersList;
  } catch (error) {
    console.error('Error fetching users:', error);
    return rejectWithValue('Failed to fetch users');
  }
});

export const createNewGroup = createAsyncThunk<
  group,
  CreateGroupPayload,
  {rejectValue: string; state: RootState}
>(
  'group/createNewGroup',
  async (
    {groupName, adminUserId, members, groupImage},
    {rejectWithValue, getState},
  ) => {
    try {
      if (!adminUserId) {
        return rejectWithValue('Admin user ID is required');
      }

      const uniqueMembers = Array.from(new Set([adminUserId, ...members]));

      const groupData = {
        groupName: groupName.trim(),
        admin: adminUserId,
        members: uniqueMembers,
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
        groupImage: groupImage || null,
      };

      const docRef = await addDoc(collection(db, 'groups'), groupData);

      await addDoc(collection(db, 'groups', docRef.id, 'messages'), {
        text: 'Group created',
        senderId: adminUserId,
        timestamp: serverTimestamp(),
        systemMessage: true,
      });

      return {
        id: docRef.id,
        ...groupData,
        membersCount: uniqueMembers.length,
        groupImageUrl: groupImage,
      } as group;
    } catch (error) {
      console.error('Error creating group:', error);
      return rejectWithValue('Failed to create group: ' + error);
    }
  },
);

export const getDeviceContacts = createAsyncThunk<
  DeviceContact[],
  any[],
  {rejectValue: string}
>('group/getDeviceContacts', async (contactsList, {rejectWithValue}) => {
  try {
    // Format device contacts to match our interface
    const formattedContacts = contactsList.map(contact => ({
      recordID: contact.recordID,
      displayName: contact.displayName || 'Unknown',
      phoneNumbers: contact.phoneNumbers || [],
      isFirebaseUser: false as const,
      profilePicture: contact.thumbnailPath || null,
    }));
    return formattedContacts;
  } catch (error) {
    console.error('Error processing contacts:', error);
    return rejectWithValue('Failed to process contacts');
  }
});

interface SearchPayload {
  query: string;
  users: FirebaseUser[];
  deviceContacts: DeviceContact[];
}

export const searchContactsAndUsers = createAsyncThunk<
  Contact[],
  SearchPayload,
  {rejectValue: string}
>(
  'group/searchContactsAndUsers',
  async ({query, users, deviceContacts}, {rejectWithValue}) => {
    try {
      const searchQuery = query.toLowerCase();
      console.log('Starting search with query:', searchQuery);

      const filteredUsers = users.filter(user => {
        const nameMatch = user.name?.toLowerCase().includes(searchQuery);
        const phoneMatch = user.phone?.toLowerCase().includes(searchQuery);
        return nameMatch || phoneMatch;
      });

      const filteredContacts = deviceContacts.filter(contact => {
        const nameMatch = contact.displayName
          ?.toLowerCase()
          .includes(searchQuery);
        const phoneMatch = contact.phoneNumbers?.some(phone =>
          phone.number?.toLowerCase().includes(searchQuery),
        );
        return nameMatch || phoneMatch;
      });

      const results = [...filteredUsers, ...filteredContacts];
      console.log('Search results count:', results.length);
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return rejectWithValue('Failed to search contacts');
    }
  },
);

export const fetchGroupDetails = createAsyncThunk<
  group,
  string,
  {rejectValue: string}
>('group/fetchGroupDetails', async (groupId, {rejectWithValue}) => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (groupDoc.exists()) {
      const groupData = groupDoc.data();
      const membersCount = groupData.members ? groupData.members.length : 0;
      return {
        id: groupDoc.id,
        ...groupData,
        membersCount,
        groupImageUrl: groupData.groupImage || null,
      } as group;
    } else {
      return rejectWithValue('Group not found');
    }
  } catch (error) {
    console.error('Error fetching group details:', error);
    return rejectWithValue('Failed to fetch group details');
  }
});

export const fetchUserDetails = createAsyncThunk<
  {userId: string; name: string},
  string,
  {rejectValue: string}
>('group/fetchUserDetails', async (userId, {rejectWithValue}) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {userId, name: userData.name || 'Unknown'};
    } else {
      return rejectWithValue('User not found');
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    return rejectWithValue('Failed to fetch user details');
  }
});

export const addExpense = createAsyncThunk<
  void,
  AddExpensePayload,
  {rejectValue: string}
>(
  'group/addExpense',
  async (
    {groupId, paidBy, amount, splitBetween, description},
    {rejectWithValue},
  ) => {
    try {
      await addExpenseToFirestore(
        groupId,
        paidBy,
        amount,
        splitBetween,
        description,
      );
    } catch (error) {
      console.error('Error adding expense:', error);
      return rejectWithValue('Failed to add expense');
    }
  },
);

const initialState: GroupState = {
  groups: [],
  selectedMembers: [],
  searchResults: [],
  deviceContacts: [],
  users: [],
  loading: false,
  error: null,
  selectedGroup: null,
  memberNames: {},
  balances: {},
};
interface ExpensePayload {
  groupId: string;
  paidBy: string;
  amount: number;
  splitBetween: string[];
}

const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    toggleMemberSelection: (state, action: PayloadAction<string>) => {
      const memberId = action.payload;
      if (state.selectedMembers.includes(memberId)) {
        state.selectedMembers = state.selectedMembers.filter(
          (id: string) => id !== memberId,
        );
      } else {
        state.selectedMembers.push(memberId);
      }
    },
    clearSelectedMembers: state => {
      state.selectedMembers = [];
    },
    clearSearchResults: state => {
      state.searchResults = [];
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {},

    addExpenseTransaction: (state, action: PayloadAction<ExpensePayload>) => {
      const {groupId, paidBy, amount, splitBetween} = action.payload;

      try {
        const shares = calculateShares(amount, splitBetween, paidBy);

        if (!state.balances[groupId]) {
          state.balances[groupId] = {};
        }

        Object.entries(shares).forEach(([userId, amount]) => {
          if (!state.balances[groupId][userId]) {
            state.balances[groupId][userId] = {};
          }

          if (userId !== paidBy) {
            state.balances[groupId][userId][paidBy] =
              (state.balances[groupId][userId][paidBy] || 0) + amount;
          }
        });
      } catch (error) {
        console.error('Balance calculation failed:', error);
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchGroups.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchGroups.fulfilled, (state, action) => {
      state.loading = false;
      state.groups = action.payload || [];
    });
    builder.addCase(fetchGroups.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchUsers.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.users = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(createNewGroup.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createNewGroup.fulfilled, (state, action) => {
      state.groups.push(action.payload);
      state.selectedMembers = [];
      state.loading = false;
    });
    builder.addCase(createNewGroup.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(getDeviceContacts.fulfilled, (state, action) => {
      state.deviceContacts = action.payload;
    });

    builder.addCase(searchContactsAndUsers.pending, state => {
      state.loading = true;
    });
    builder.addCase(searchContactsAndUsers.fulfilled, (state, action) => {
      state.searchResults = action.payload;
      state.loading = false;
    });
    builder.addCase(searchContactsAndUsers.rejected, (state, action) => {
      state.searchResults = [];
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchGroupDetails.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchGroupDetails.fulfilled, (state, action) => {
      state.selectedGroup = action.payload;
      state.loading = false;
    });

    builder.addCase(fetchGroupDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchUserDetails.fulfilled, (state, action) => {
      state.memberNames[action.payload.userId] = action.payload.name;
    });

    builder.addCase(addExpense.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addExpense.fulfilled, state => {
      state.loading = false;
    });
    builder.addCase(addExpense.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  toggleMemberSelection,
  clearSelectedMembers,
  clearSearchResults,
  setSearchQuery,
  addExpenseTransaction,
} = groupSlice.actions;

export default groupSlice.reducer;
