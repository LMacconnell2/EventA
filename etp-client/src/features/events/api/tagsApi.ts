const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type TagLookupItem = {
  tag_id: number;
  tag_name: string;
  active: boolean;
};

export type TagsLookupResponse = {
  data: TagLookupItem[];
  pagination: {
    page: number;
    per_page: number;
    returned: number;
    total: number;
    total_pages: number;
  };
};

export type CreatedTagResponse = {
  success: true;
  created: true;
  tag: TagLookupItem & {
    created_at: string;
    updated_at: string;
    created_by: number | null;
    updated_by: number | null;
    deleted_at: string | null;
  };
  message: string;
};

export type UpdatedTagResponse = {
  success: true;
  tag: TagLookupItem & {
    created_at: string;
    updated_at: string;
    created_by: number | null;
    updated_by: number | null;
    deleted_at: string | null;
  };
  message: string;
};

type ApiErrorBody = {
  message?: string;
  error?: string;
  code?: string;
};

async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorBody: ApiErrorBody | null = null;

    try {
      errorBody = (await response.json()) as ApiErrorBody;
    } catch {
      // The API response did not contain JSON.
    }

    throw new Error(
      errorBody?.message ??
        errorBody?.error ??
        `Request failed with status ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getTagOptions(
  options: {
    q?: string;
    active?: true | "all";
    page?: number;
    perPage?: number;
  } = {},
  signal?: AbortSignal,
): Promise<TagsLookupResponse> {
  const params = new URLSearchParams();

  if (options.q?.trim()) {
    params.set("q", options.q.trim());
  }

  params.set(
    "active",
    options.active === "all" ? "all" : "true",
  );

  params.set("page", String(options.page ?? 1));
  params.set("per_page", String(options.perPage ?? 100));
  params.set("sort", "tag_name");
  params.set("order", "asc");

  return apiRequest<TagsLookupResponse>(
    `/api/lookups/tags?${params.toString()}`,
    { signal },
  );
}

export function createTag(
  tagName: string,
): Promise<CreatedTagResponse> {
  return apiRequest<CreatedTagResponse>("/api/tags", {
    method: "POST",
    body: JSON.stringify({
      tag_name: tagName,
    }),
  });
}

export function updateTag(
  tagId: number,
  updates: {
    tag_name?: string;
    active?: boolean;
  },
): Promise<UpdatedTagResponse> {
  return apiRequest<UpdatedTagResponse>(
    `/api/tags/${tagId}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    },
  );
}

export function deleteTag(tagId: number): Promise<{
  success: true;
  tag_id: number;
  message: string;
}> {
  return apiRequest(`/api/tags/${tagId}`, {
    method: "DELETE",
  });
}