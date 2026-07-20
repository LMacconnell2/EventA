import type {
  BulkRoleMode,
  CreateUserInput,
  UpdateUserInput,
  UserDetails,
  UserListQuery,
  UserListResponse,
  UserRole,
  UserStatus,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ message: "Request failed." }));

    throw new Error(errorBody.message ?? "Request failed.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function buildQueryString(query: UserListQuery): string {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== false
    ) {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

type RoleLookupResponse = {
  data: Array<{
    role_id: number;
    role_name: string;
    active: boolean;
  }>;
};

type UserStatusLookupResponse = {
  data: Array<{
    user_status_id: number;
    user_status_name: string;
    active: boolean;
  }>;
};

export const usersApi = {
  list(query: UserListQuery): Promise<UserListResponse> {
    return apiRequest(`/api/users${buildQueryString(query)}`);
  },

  getById(userId: number): Promise<{ user: UserDetails }> {
    return apiRequest(`/api/users/${userId}`);
  },

  create(input: CreateUserInput): Promise<{ user: UserDetails }> {
    return apiRequest("/api/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(
    userId: number,
    input: UpdateUserInput,
  ): Promise<{ user: UserDetails }> {
    return apiRequest(`/api/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  remove(userId: number): Promise<void> {
    return apiRequest(`/api/users/${userId}`, {
      method: "DELETE",
    });
  },

  bulkStatus(userIds: number[], statusId: number): Promise<void> {
    return apiRequest("/api/users/bulk/status", {
      method: "POST",
      body: JSON.stringify({ userIds, statusId }),
    });
  },

  bulkRoles(
    userIds: number[],
    roleIds: number[],
    mode: BulkRoleMode,
  ): Promise<void> {
    return apiRequest("/api/users/bulk/roles", {
      method: "POST",
      body: JSON.stringify({ userIds, roleIds, mode }),
    });
  },

  bulkDelete(userIds: number[]): Promise<void> {
    return apiRequest("/api/users/bulk/delete", {
      method: "POST",
      body: JSON.stringify({ userIds }),
    });
  },

  uploadProfilePhoto(
    userId: number,
    file: File,
  ): Promise<{ profilePhoto: string }> {
    const formData = new FormData();
    formData.append("photo", file);

    return apiRequest(`/api/users/${userId}/profile-photo`, {
      method: "POST",
      body: formData,
    });
  },

  removeProfilePhoto(userId: number): Promise<void> {
    return apiRequest(`/api/users/${userId}/profile-photo`, {
      method: "DELETE",
    });
  },

  async roles(): Promise<UserRole[]> {
    const response = await apiRequest<RoleLookupResponse>(
      "/api/lookups/roles?active=true",
    );

    return response.data.map((role) => ({
      id: role.role_id,
      name: role.role_name,
    }));
  },

  async statuses(): Promise<UserStatus[]> {
    const response = await apiRequest<UserStatusLookupResponse>(
      "/api/lookups/user-statuses?active=true",
    );

    return response.data.map((status) => ({
      id: status.user_status_id,
      name: status.user_status_name,
      active: status.active,
    }));
  },
};
