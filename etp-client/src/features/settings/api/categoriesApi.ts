import type {
  CategoriesResponse,
  CategoryMutationResponse,
  CategoryType,
  GetCategoriesParams,
  SaveCategoryInput,
} from "../types/categoryTypes";

const API_URL = import.meta.env.VITE_API_URL ?? "";

type ApiErrorResponse = {
  message?: string;
};

export class CategoriesApiError extends Error {
  status: number;
  data: ApiErrorResponse;

  constructor(
    message: string,
    status: number,
    data: ApiErrorResponse,
  ) {
    super(message);

    this.name = "CategoriesApiError";
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
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  const data = (await response.json().catch(() => ({
    message: "An unexpected server response was received.",
  }))) as T | ApiErrorResponse;

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;

    throw new CategoriesApiError(
      errorData.message ?? "The category request failed.",
      response.status,
      errorData,
    );
  }

  return data as T;
}

export async function getCategories(
  type: CategoryType,
  params: GetCategoriesParams = {},
): Promise<CategoriesResponse> {
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

  const queryString = searchParams.toString();

  return request<CategoriesResponse>(
    `/api/settings/categories/${type}${
      queryString ? `?${queryString}` : ""
    }`,
  );
}

export async function createCategory(
  type: CategoryType,
  input: SaveCategoryInput,
): Promise<CategoryMutationResponse> {
  return request<CategoryMutationResponse>(
    `/api/settings/categories/${type}`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function updateCategory(
  type: CategoryType,
  categoryId: number,
  input: SaveCategoryInput,
): Promise<CategoryMutationResponse> {
  return request<CategoryMutationResponse>(
    `/api/settings/categories/${type}/${categoryId}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}

export async function deactivateCategory(
  type: CategoryType,
  categoryId: number,
): Promise<CategoryMutationResponse> {
  return request<CategoryMutationResponse>(
    `/api/settings/categories/${type}/${categoryId}`,
    {
      method: "DELETE",
    },
  );
}