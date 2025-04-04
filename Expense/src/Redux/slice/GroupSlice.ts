import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {db} from '../../services/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import {RootState} from '../store';

// Define contact interfaces
interface PhoneNumber {
  number: string;
  label?: string;
}

interface FirebaseUser {
  id: string;
  name: string;
  phone: string;
  profilePicture: string | null;
  isFirebaseUser: true;
}

interface DeviceContact {
  recordID: string;
  displayName: string;
  phoneNumbers: PhoneNumber[];
  isFirebaseUser: false;
  profilePicture: string | null;
}

type Contact = FirebaseUser | DeviceContact;

// Define group types
interface Group {
  id: string;
  groupName: string;
  admin: string;
  members: string[];
  createdAt: string;
  groupImage: string | null;
  membersCount: number;
  groupImageUrl: string | null;
}

// Define group state type
interface GroupState {
  groups: Group[];
  selectedMembers: string[];
  searchResults: Contact[];
  deviceContacts: DeviceContact[];
  users: FirebaseUser[];
  loading: boolean;
  error: string | null;
}

// Fetch all groups
export const fetchGroups = createAsyncThunk<
  Group[],
  void,
  {rejectValue: string}
>('group/fetchGroups', async (_, {rejectWithValue}) => {
  try {
    const groupsSnapshot = await getDocs(collection(db, 'groups'));
    const groupsList = await Promise.all(
      groupsSnapshot.docs.map(async doc => {
        const groupData = doc.data();
        const membersCount = groupData.members ? groupData.members.length : 0;

        return {
          id: doc.id,
          ...groupData,
          membersCount,
          groupImageUrl: groupData.groupImage || null,
        } as Group;
      }),
    );
    return groupsList;
  } catch (error) {
    console.error('Error fetching groups:', error);
    return rejectWithValue('Failed to fetch groups');
  }
});

// Fetch users from Firestore
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
        name: data.name,
        phone: data.phone,
        profilePicture: data.profilePicture,
        isFirebaseUser: true,
      } as FirebaseUser;
    });
    return usersList;
  } catch (error) {
    console.error('Error fetching users:', error);
    return rejectWithValue('Failed to fetch users');
  }
});

// Interface for creating a new group
interface CreateGroupPayload {
  groupName: string;
  adminUserId: string;
  members: string[];
  groupImage: string | null;
}

// Create a new group
export const createNewGroup = createAsyncThunk<
  Group,
  CreateGroupPayload,
  {rejectValue: string}
>(
  'group/createNewGroup',
  async ({groupName, adminUserId, members, groupImage}, {rejectWithValue}) => {
    try {
      const groupData = {
        groupName,
        admin: adminUserId,
        members: [adminUserId, ...members.filter(id => id !== adminUserId)],
        createdAt: new Date().toISOString(),
        groupImage,
      };

      const docRef = await addDoc(collection(db, 'groups'), groupData);
      return {
        id: docRef.id,
        ...groupData,
        membersCount: groupData.members.length,
        groupImageUrl: groupImage,
      } as Group;
    } catch (error) {
      console.error('Error creating group:', error);
      return rejectWithValue('Failed to create group');
    }
  },
);

// Fetch device contacts
export const getDeviceContacts = createAsyncThunk<
  DeviceContact[],
  any[],
  {rejectValue: string}
>('group/getDeviceContacts', async (contactsList, {rejectWithValue}) => {
  try {
    // The actual contacts fetching is done in the component
    // This just stores the contacts in Redux state
    const formattedContacts = contactsList.map(contact => ({
      recordID: contact.recordID,
      displayName: contact.displayName,
      phoneNumbers: contact.phoneNumbers,
      isFirebaseUser: false as const,
      profilePicture: contact.thumbnailPath || null,
    }));
    return formattedContacts;
  } catch (error) {
    console.error('Error processing contacts:', error);
    return rejectWithValue('Failed to process contacts');
  }
});

// Interface for search payload
interface SearchPayload {
  query: string;
  users: FirebaseUser[];
  deviceContacts: DeviceContact[];
}

// Search contacts and users
export const searchContactsAndUsers = createAsyncThunk<
  Contact[],
  SearchPayload,
  {rejectValue: string}
>(
  'group/searchContactsAndUsers',
  async ({query, users, deviceContacts}, {rejectWithValue}) => {
    try {
      if (query.trim() === '') {
        return [];
      }

      const searchQuery = query.toLowerCase();
      const allContacts = [...users, ...deviceContacts];

      const results = allContacts.filter(contact => {
        const nameMatch = (
          contact.isFirebaseUser ? contact.name : contact.displayName || ''
        )
          .toLowerCase()
          .includes(searchQuery);

        const phoneMatch = contact.isFirebaseUser
          ? contact.phone.toLowerCase().includes(searchQuery)
          : (contact.phoneNumbers?.[0]?.number || '')
              .toLowerCase()
              .includes(searchQuery);

        return nameMatch || phoneMatch;
      });

      return results;
    } catch (error) {
      console.error('Error searching contacts:', error);
      return rejectWithValue('Failed to search contacts');
    }
  },
);

// Initial state
const initialState: GroupState = {
  groups: [],
  selectedMembers: [],
  searchResults: [],
  deviceContacts: [],
  users: [],
  loading: false,
  error: null,
};

const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    toggleMemberSelection: (state, action: PayloadAction<string>) => {
      const memberId = action.payload;
      if (state.selectedMembers.includes(memberId)) {
        state.selectedMembers = state.selectedMembers.filter(
          id => id !== memberId,
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
    setSearchQuery: (state, action: PayloadAction<string>) => {
      // This is just a placeholder - the actual search will be triggered by the thunk
      // We could store the current searchQuery here if needed
    },
  },
  extraReducers: builder => {
    // Fetch groups
    builder.addCase(fetchGroups.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchGroups.fulfilled, (state, action) => {
      state.groups = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchGroups.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch users
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

    // Create group
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

    // Get device contacts
    builder.addCase(getDeviceContacts.fulfilled, (state, action) => {
      state.deviceContacts = action.payload;
    });

    // Search contacts and users
    builder.addCase(searchContactsAndUsers.fulfilled, (state, action) => {
      state.searchResults = action.payload;
    });
  },
});

export const {
  toggleMemberSelection,
  clearSelectedMembers,
  clearSearchResults,
  setSearchQuery,
} = groupSlice.actions;

export default groupSlice.reducer;
