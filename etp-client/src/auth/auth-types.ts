export interface AuthenticatedUser {
  id: string | number;
  name: string;
  email: string;
  image: string | null;
}