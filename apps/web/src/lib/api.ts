const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1";

// A simple in-memory store for the CSRF token
let csrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }
  const res = await fetch(`${API_URL}/auth/csrf`);
  if (!res.ok) {
    throw new Error("Failed to fetch CSRF token");
  }
  const { data } = await res.json();
  if (!data.csrfToken) {
    throw new Error("CSRF token not found in response");
  }
  csrfToken = data.csrfToken;
  return csrfToken as string;
}

async function request<T>(
  method: string,
  endpoint: string,
  data?: unknown
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const token = await getCsrfToken();
    headers["x-csrf-token"] = token;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json();
    if (res.status === 401) {
      // Redirect to sign-in on the client-side
      if (typeof window !== "undefined") {
        window.location.href = "/auth/sign-in";
      }
    }
    throw new Error(errorData.error.message || "API request failed");
  }

  const responseData = await res.json();
  return responseData.data;
}

export const api = {
  get: <T>(endpoint: string) => request<T>("GET", endpoint),
  post: <T>(endpoint: string, data: unknown) =>
    request<T>("POST", endpoint, data),
  patch: <T>(endpoint: string, data: unknown) =>
    request<T>("PATCH", endpoint, data),
  delete: <T>(endpoint: string) => request<T>("DELETE", endpoint),
};
