import type {
  ChangePasswordInput,
  MyProfile,
  UpdateMyProfileInput,
} from "../types/profileTypes";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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

export const profileApi = {
  getProfile(): Promise<{ user: MyProfile }> {
    return apiRequest("/api/users/me/profile");
  },

  updateProfile(
    input: UpdateMyProfileInput,
  ): Promise<{
    message: string;
    user: MyProfile;
    emailChangePending: boolean;
    pendingEmail?: string;
  }> {
    return apiRequest("/api/users/me/profile", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  changePassword(input: ChangePasswordInput): Promise<{
    success: boolean;
    message: string;
    otherSessionsRevoked: boolean;
  }> {
    return apiRequest("/api/users/me/change-password", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  uploadProfilePhoto(file: File): Promise<{
    message: string;
    profilePhoto: string;
  }> {
    const formData = new FormData();
    formData.append("photo", file);

    return apiRequest("/api/users/me/profile-photo", {
      method: "POST",
      body: formData,
    });
  },

  removeProfilePhoto(): Promise<{
    success: boolean;
    message: string;
    profilePhoto: null;
  }> {
    return apiRequest("/api/users/me/profile-photo", {
      method: "DELETE",
    });
  },

  deleteAccount(): Promise<{
    success: boolean;
    message: string;
    redirectTo: string;
  }> {
    return apiRequest("/api/users/me", {
      method: "DELETE",
    });
  },
};