import type {
  ApiErrorResponse,
  DeactivateRoleResponse,
  RoleResponse,
  RolesResponse,
  SaveRoleInput,
  SaveRoleResponse,
} from "../types/roles";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export class RolesApiError extends Error {
  status: number;
  data: ApiErrorResponse | Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    data: ApiErrorResponse | Record<string, unknown>,
  ) {
    super(message);
    this.name = "RolesApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = (await response.json().catch(() => ({
    message: "An unexpected server response was received.",
  }))) as T | ApiErrorResponse;

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;

    throw new RolesApiError(
      errorData.message ?? "The request failed.",
      response.status,
      errorData,
    );
  }

  return data as T;
}

export type GetRolesParams = {
  active?: boolean;
  limit?: number;
  offset?: number;
  q?: string;
};

export async function getRoles(
  params: GetRolesParams = {},
): Promise<RolesResponse> {
  const searchParams = new URLSearchParams();

  if (params.active !== undefined) {
    searchParams.set("active", String(params.active));
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }

  if (params.q?.trim()) {
    searchParams.set("q", params.q.trim());
  }

  const query = searchParams.toString();

  return request<RolesResponse>(
    `/api/settings/roles${query ? `?${query}` : ""}`,
  );
}

export async function getRole(roleId: number): Promise<RoleResponse> {
  return request<RoleResponse>(`/api/settings/roles/${roleId}`);
}

export async function createRole(
  input: SaveRoleInput,
): Promise<SaveRoleResponse> {
  return request<SaveRoleResponse>("/api/settings/roles", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateRole(
  roleId: number,
  input: SaveRoleInput,
): Promise<SaveRoleResponse> {
  return request<SaveRoleResponse>(
    `/api/settings/roles/${roleId}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}

export async function deactivateRole(
  roleId: number,
): Promise<DeactivateRoleResponse> {
  return request<DeactivateRoleResponse>(
    `/api/settings/roles/${roleId}`,
    {
      method: "DELETE",
    },
  );
}