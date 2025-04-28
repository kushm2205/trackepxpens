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
  AddPersonalExpense: undefined;
  PersonalExpensesScreen: undefined;
  EditFriendExpenss: {
    expense: any;
    friend: Friend;
    onUpdate: () => void;
  };
  ChatScreenFriend: {friend: Friend};
  PaymentGateway: undefined;
  GroupChatScreen: {groupId: string; groupName: string};

  GroupDetails: {groupId: string};
  PieChart: PieChartScreenParams;
  EditExpense: {groupId: string; expenseId: string};
  FriendPie: {friend: Friend};
  PiChartFriend: {friend: Friend; expenses: any[]};
};
export type PieChartScreenParams = {
  chartData: ChartData[];
  groupName: string;
  memberBalances: MemberBalance[];
};
interface ChartData {
  name: string;
  amount: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

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
export interface group {
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
  phoneNumbers?: {number: string}[];
  profilePicture?: string;
  isFirebaseUser?: boolean;
}
interface GroupState {
  groups: group[];
  selectedMembers: string[];
  searchResults: Contact[];
  deviceContacts: DeviceContact[];
  users: FirebaseUser[];
  loading: boolean;
  error: string | null;
  selectedGroup: group | null;
  memberNames: Record<string, string>;
  balances: Record<string, Record<string, Record<string, number>>>;
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

export interface AuthState {
  auth: any;
  photo: string;
  phone: string;
  name: string;
  userId: string | null;
  email: string | null;
  photoURL: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  subscription?: Subscription;
}
interface Subscription {
  status: string;
  currentPeriodEnd: Date;
  planId: string;
  subscriptionId: string;
}

export interface ActivityItem {
  id: string;
  type: 'group' | 'friend' | 'groupExpense' | 'friendExpense';
  createdAt: Date;
  createdBy: string;
  paidBy?: string;
  someonePaidForMe?: boolean;
  extraDesc?: string;
  amount?: number;
  groupName?: string;
  name?: string;
  description?: string;
  splitBetween?: string[];
}

export interface MemberBalance {
  memberId: string;
  name: string;
  balance: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}
export type EditExpenseRouteProp = {
  expense: any;
  friend: any;
  onUpdate: () => void;
};
export type FriendExpenseListRouteProp = {
  friend: Friend;
};
// types/notificationTypes.ts
export type NotificationType = {
  id?: string;
  title: string;
  body: string;
  data?: {
    type: 'expense' | 'settlement' | 'group';
    groupId?: string;
    expenseId?: string;
  };
  read: boolean;
  userId: string;
  createdAt: Date | string;
};

export type PushNotificationPayload = {
  notification: {
    title: string;
    body: string;
  };
  data?: {
    type: string;
    groupId?: string;
    expenseId?: string;
  };
};
