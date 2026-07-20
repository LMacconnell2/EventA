export type SortOrder = "asc" | "desc";

export type UserSortField =
  | "username"
  | "fname"
  | "lname"
  | "email"
  | "created_at"
  | "updated_at"
  | "last_login";

export interface UserListQuery {
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
  sort?: UserSortField;
  order?: SortOrder;
}

export interface UserIdParams {
  id: number;
}

export interface UserProfilePatchBody {
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
}

export interface AdminUserPatchBody extends UserProfilePatchBody {
  statusId?: number;
  roleIds?: number[];
}

export interface CreateUserBody {
  username: string;
  email: string;
  fname: string;
  lname: string;
  statusId: number;
  roleIds: number[];
  temporaryPassword: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}

export interface BulkStatusBody {
  userIds: number[];
  statusId: number;
}

export interface BulkRolesBody {
  userIds: number[];
  roleIds: number[];
  mode: "replace" | "add" | "remove";
}

export interface BulkDeleteBody {
  userIds: number[];
}