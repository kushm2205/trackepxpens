// Main navigation types
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  GroupScreen: undefined;
  CreateGroup: undefined;
  Account: undefined;
  FriendsScreen: undefined;
  FriendRequest: undefined;
  GroupDetailsScreen: {groupId: string};
  AddExpense: {groupId: string};
  Expense: {groupId: string};
  AddFriendExpense: {friend: Friend};
  FriendExpenseDetails: {friend: Friend};
};

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profilePicture?: string | null;
}
export interface Friend {
  userId?: string;
  phone?: string;
  name: string;
  photo?: string;
}

// Contact types
export interface PhoneNumber {
  number: string;
  label?: string;
}

export interface FirebaseUser {
  id: string;
  name: string;
  phone: string;
  profilePicture: string | null;
  isFirebaseUser: true;
}

export interface DeviceContact {
  recordID: string;
  displayName: string;
  phoneNumbers: PhoneNumber[];
  isFirebaseUser: boolean | false;
  profilePicture: string | null;
}

export type Contact = FirebaseUser | DeviceContact;

// Group types
export interface Group {
  id: string;
  groupName: string;
  admin: string;
  members: string[];
  createdAt: string;
  groupImage: string | null;
  membersCount: number;
  groupImageUrl: string | null;
}

interface ContactItem {
  id?: string;
  recordID?: string;
  name?: string;
  displayName?: string;
  phone?: string;
  phoneNumbers?: Array<{number: string; label?: string}>;
  profilePicture?: string | null;
  isFirebaseUser?: boolean;
}
interface GroupState {
  groups: Group[];
  selectedMembers: string[];
  searchResults: Contact[];
  deviceContacts: DeviceContact[];
  users: FirebaseUser[];
  loading: boolean;
  error: string | null;
  selectedGroup: Group | null;
  memberNames: Record<string, string>;
  balances: Record<string, Record<string, number>>;
}

export interface AddExpensePayload {
  groupId: string;
  paidBy: string;
  amount: number;
  splitBetween: string[];
  description: string;
}

export interface CreateGroupPayload {
  groupName: string;
  adminUserId: string;
  members: string[];
  groupImage: string | null;
}
export interface ExpensePayload {
  groupId: string;
  paidBy: string;
  amount: number;
  splitBetween: string[];
  description?: string;
}
export interface Balance {
  [userId: string]: number;
}

export interface GroupBalances {
  [groupId: string]: {
    [userId: string]: Balance;
  };
}
export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  createdAt: any;
  groupId: string | null;
  isFriendExpense: boolean;
}
