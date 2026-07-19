export type ProfileRole = {
  id: number;
  name: string;
};

export type ProfileStatus = {
  id: number;
  name: string;
  active: boolean;
};

export type MyProfile = {
  id: number;
  username: string;
  email: string;
  contactEmail: string | null;
  status: ProfileStatus;
  position: string | null;
  bio: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  fname: string;
  lname: string;
  profilePhoto: string | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;
  updatedBy: number | null;
  roles: ProfileRole[];
};

export type UpdateMyProfileInput = {
  username?: string;
  email?: string;
  contactEmail?: string | null;
  position?: string | null;
  bio?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip?: string | null;
  fname?: string;
  lname?: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions: boolean;
};