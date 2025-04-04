// Main navigation types
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  GroupScreen: undefined;
  CreateGroup: undefined;
  Account: undefined;
};

// User type
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profilePicture?: string | null;
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
  isFirebaseUser: boolean;
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
