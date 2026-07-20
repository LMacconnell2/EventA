export interface RolePermission {
    permission_id: number;
    permission_name: string;
}

export interface RoleRecord {
    role_id: number;
    role_name: string;
    active: boolean;
    created_at: string;
    updated_at: string;
    created_by: number | null;
    updated_by: number | null;
    deleted_at: string | null;
    permissions: RolePermission[];
    permissions_count: number;
    user_count: number;
}

export interface AssignedRoleUser {
    user_id: number;
    username: string;
    email: string;
    fname: string;
    lname: string;
}

export interface GetRolesQuery {
    active?: boolean;
    limit?: number;
    offset?: number;
    q?: string;
    include_permissions?: boolean;
}

export interface RoleIdParams {
    id: string;
}

export interface CreateRoleBody {
    role_name: string;
    active?: boolean;
    permission_ids?: number[];
}

export interface UpdateRoleBody {
    role_name?: string;
    active?: boolean;
    permission_ids?: number[];
}