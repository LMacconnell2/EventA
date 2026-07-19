export interface CurrentUser {
  id: number;
  authId: string;
  username: string;
  name: string;
  email: string;
  image: string | null;
  fname: string;
  lname: string;
  roles: string[];
  permissions: string[];
}

interface CurrentUserResponse {
  user: CurrentUser;
}

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/users/me`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Could not load current user: ${response.status}`,
    );
  }

  const data = (await response.json()) as CurrentUserResponse;

  return data.user;
}