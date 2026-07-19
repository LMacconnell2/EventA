export interface AuthenticatedUser {
  userId: number;
  authId: string;
  username: string;
  email: string;
  fname: string;
  lname: string;
  roles: string[];
  permissions: string[];
}