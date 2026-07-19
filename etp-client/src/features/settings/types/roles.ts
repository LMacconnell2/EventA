export type Permission = {
  permission_id: number;
  permission_name: string;
};

export type Role = {
  role_id: number;
  role_name: string;
  active: boolean;

  /**
   * The API should eventually return this.
   * Built-in roles cannot be edited or deleted.
   */
  built_in?: boolean;

  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;

  permissions: Permission[];
  permissions_count: number;
  user_count: number;
};

export type RolesPagination = {
  limit: number;
  offset: number;
  returned: number;
  total: number;
};

export type RolesResponse = {
  roles: Role[];
  pagination: RolesPagination;
};

export type RoleResponse = {
  role: Role;
};

export type SaveRoleInput = {
  role_name: string;
  active: boolean;
  permission_ids: number[];
};

export type SaveRoleResponse = {
  message: string;
  role: Role;
};

export type DeactivatedRole = {
  role_id: number;
  role_name: string;
  active: false;
  deleted_at: string;
};

export type DeactivateRoleResponse = {
  message: string;
  role: DeactivatedRole;
};

export type AssignedRoleUser = {
  user_id: number;
  username: string;
  email: string;
  fname: string;
  lname: string;
};

export type RoleAssignedUsersError = {
  message: string;
  role_id: number;
  assigned_user_count: number;
  assigned_users: AssignedRoleUser[];
};

export type ApiErrorResponse = {
  message: string;
  invalid_permission_ids?: number[];
};