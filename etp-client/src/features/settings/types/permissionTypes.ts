export type Permission = {
  permission_id: number;
  permission_name: string;
  description: string | null;
  permission_group: string;
  permission_label: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type PermissionsPagination = {
  limit: number;
  offset: number;
  returned: number;
  total: number;
};

export type PermissionsResponse = {
  permissions: Permission[];
  groups: string[];
  pagination: PermissionsPagination;
};

export type GetPermissionsParams = {
  active?: boolean;
  q?: string;
  group?: string;
  limit?: number;
  offset?: number;
};