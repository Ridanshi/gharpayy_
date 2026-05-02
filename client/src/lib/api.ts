import { useAuthStore } from "@/stores/auth";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("Missing VITE_API_URL. Set it to your deployed backend API URL.");
}

type ApiResponse<T> = { success: boolean; data: T; message: string };

export async function api<T>(path: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const json = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !json.success) throw new Error(json.message ?? "Request failed");
  return json.data;
}
