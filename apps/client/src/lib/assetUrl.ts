const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function getAssetUrl(path: string | null): string | undefined {
  if (!path) {
    return undefined;
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}