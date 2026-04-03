import type { 
  Case, 
  CaseFormData, 
  LoginCredentials, 
  LoginResponse, 
  VerifyResponse,
  User 
} from "@/types";

// API base URL - from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================
// FETCH WRAPPER
// ============================================
interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchAPI<T>(
  endpoint: string, 
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: "include", // For cookies
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(error.detail || `Error ${response.status}`);
  }

  return response.json();
}

// ============================================
// AUTH API
// ============================================
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    return fetchAPI<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  logout: async (): Promise<void> => {
    await fetchAPI("/auth/logout", { method: "POST" });
  },

  verify: async (): Promise<VerifyResponse> => {
    return fetchAPI<VerifyResponse>("/auth/verificar");
  },

  getMe: async (token: string): Promise<User> => {
    return fetchAPI<User>("/auth/me", { token });
  },

  changePassword: async (
    token: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<void> => {
    await fetchAPI("/auth/cambiar-password", {
      method: "PUT",
      token,
      body: JSON.stringify({
        password_actual: currentPassword,
        password_nuevo: newPassword,
      }),
    });
  },
};

// ============================================
// CASES API
// ============================================
export const casesApi = {
  getAll: async (token?: string): Promise<Case[]> => {
    return fetchAPI<Case[]>("/api/casos", { token });
  },

  getById: async (id: number, token?: string): Promise<Case> => {
    return fetchAPI<Case>(`/api/casos/${id}`, { token });
  },

  create: async (data: CaseFormData, token?: string): Promise<Case> => {
    return fetchAPI<Case>("/api/casos", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<CaseFormData>, token?: string): Promise<Case> => {
    return fetchAPI<Case>(`/api/casos/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number, token?: string): Promise<void> => {
    await fetchAPI(`/api/casos/${id}`, {
      method: "DELETE",
      token,
    });
  },

  notify: async (id: number, token?: string): Promise<{ mensaje: string }> => {
    return fetchAPI<{ mensaje: string }>(`/api/casos/${id}/notificar`, {
      method: "POST",
      token,
    });
  },
};

// ============================================
// STATS (calculated client-side for now)
// ============================================
export function calculateStats(cases: Case[]) {
  return {
    total: cases.length,
    activos: cases.filter(c => !["resuelto", "archivado"].includes(c.estado)).length,
    resueltos: cases.filter(c => c.estado === "resuelto").length,
    pendientes_documento: cases.filter(c => c.estado === "pendiente_documento").length,
  };
}
