import type {
  GetPermissionsParams,
  PermissionsResponse,
} from "../types/permissionTypes";

const API_URL = import.meta.env.VITE_API_URL ?? "";

type ApiErrorResponse = {
  message?: string;
};

export class PermissionsApiError extends Error {
  status: number;
  data: ApiErrorResponse;

  constructor(
    message: string,
    status: number,
    data: ApiErrorResponse,
  ) {
    super(message);

    this.name = "PermissionsApiError";
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
      Accept: "application/json",
      ...options.headers,
    },
  });

  const data = (await response.json().catch(() => ({
    message: "An unexpected server response was received.",
  }))) as T | ApiErrorResponse;

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;

    throw new PermissionsApiError(
      errorData.message ?? "The request failed.",
      response.status,
      errorData,
    );
  }

  return data as T;
}

export async function getPermissions(
  params: GetPermissionsParams = {},
): Promise<PermissionsResponse> {
  const searchParams = new URLSearchParams();

  if (params.active !== undefined) {
    searchParams.set("active", String(params.active));
  }

  if (params.q?.trim()) {
    searchParams.set("q", params.q.trim());
  }

  if (params.group?.trim()) {
    searchParams.set("group", params.group.trim());
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }

  const queryString = searchParams.toString();

  return request<PermissionsResponse>(
    `/api/settings/permissions${
      queryString ? `?${queryString}` : ""
    }`,
  );
}