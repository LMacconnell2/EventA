export interface GetPermissionsQuery {
    active?: boolean;
    q?: string;
    group?: string;
    limit?: number;
    offset?: number;
}

export interface PermissionRecord {
    permission_id: number;
    permission_name: string;
    description: string | null;
    permission_group: string;
    permission_label: string;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PermissionListResult {
    permissions: PermissionRecord[];
    groups: string[];
    pagination: {
        limit: number;
        offset: number;
        returned: number;
        total: number;
    };
}