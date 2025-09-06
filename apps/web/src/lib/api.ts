// frontend/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string; details?: object } | null;
  meta: { requestId?: string; timestamp: string };
}

let csrfToken: string | null = null;

async function getCsrfToken(forceRefresh = false): Promise<string> {
  if (csrfToken && !forceRefresh) return csrfToken;

  const res = await fetch(`${API_URL}/auth/csrf`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch CSRF token");

  const { data }: ApiResponse<{ csrfToken: string }> = await res.json();
  if (!data?.csrfToken) throw new Error("No CSRF token in response");

  csrfToken = data.csrfToken; // 👈 this is the SAME token stored in cookie
  return csrfToken;
}

async function request<T>(method: string, endpoint: string, bodyData?: unknown): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const token = await getCsrfToken();
    headers["x-csrf-token"] = token; // 👈 matches cookie value
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: bodyData ? JSON.stringify(bodyData) : undefined,
    credentials: "include",
  });

  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error?.message || "API request failed");
  return json.data as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>("GET", endpoint),
  post: <T>(endpoint: string, data: unknown) => request<T>("POST", endpoint, data),
  patch: <T>(endpoint: string, data: unknown) => request<T>("PATCH", endpoint, data),
  delete: <T>(endpoint: string) => request<T>("DELETE", endpoint),
};
