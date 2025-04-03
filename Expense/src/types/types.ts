export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Account: undefined;
  CreateGroupScreen: undefined;
  GroupScreen: {groupId: string};
};
export interface User {
  userId: string;
  name: string;
  phone: string;
  email: string;
  profilePicture: string | null;
  // Add other user properties as needed
}

// Add other types as needed
