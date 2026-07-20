export type UserRole = {
  id: number;
  name: string;
};

export type UserStatus = {
  id: number;
  name: string;
  active: boolean;
};

export type UserListItem = {
  id: number;
  username: string;
  profilePhoto: string | null;
  fname: string;
  lname: string;
  email: string;
  status: UserStatus;
  roles: UserRole[];
  createdAt: string;
  lastLogin: string | null;
};

export type UserDetails = UserListItem & {
  authId: string;
  contactEmail: string | null;
  position: string | null;
  bio: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  updatedAt: string;
  createdBy: number | null;
  updatedBy: number | null;
  deletedAt: string | null;
};

export type UserListQuery = {
  q?: string;
  role_ids?: string;
  status_ids?: string;
  date_joined_start?: string;
  date_joined_end?: string;
  last_login_start?: string;
  last_login_end?: string;
  include_deleted?: boolean;
  limit?: number;
  offset?: number;
  sort?: "username" | "fname" | "lname" | "email" | "created_at" | "updated_at" | "last_login";
  order?: "asc" | "desc";
};

export type UserListResponse = {
  data: UserListItem[];
  pagination: {
    limit: number;
    offset: number;
    returned: number;
    total: number;
    hasMore: boolean;
  };
};

export type CreateUserInput = {
  username: string;
  email: string;
  fname: string;
  lname: string;
  statusId: number;
  roleIds: number[];
  temporaryPassword: string;
};

export type UpdateUserInput = {
  username?: string;
  email?: string;
  contactEmail?: string | null;
  statusId?: number;
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
  roleIds?: number[];
};

export type BulkRoleMode = "replace" | "add" | "remove";
