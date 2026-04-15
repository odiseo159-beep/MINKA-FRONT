import type {
  Case,
  CaseFormData,
  LoginCredentials,
  RegisterCredentials,
  LoginResponse,
  VerifyResponse,
  User,
  CalcPlazoRequest,
  CalcPlazoResponse,
  Feriado,
  NormativaResponse,
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
// FETCH UPLOAD (multipart/form-data)
// ============================================
async function fetchUpload<T>(
  endpoint: string,
  formData: FormData,
  token?: string,
): Promise<T> {
  const headers: HeadersInit = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
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

  register: async (credentials: RegisterCredentials): Promise<LoginResponse> => {
    return fetchAPI<LoginResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  logout: async (): Promise<void> => {
    await fetchAPI("/auth/logout", { method: "POST" });
  },

  verify: async (token?: string): Promise<VerifyResponse> => {
    return fetchAPI<VerifyResponse>("/auth/verificar", { token });
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

  uploadDocument: async (id: number, file: File, token?: string): Promise<Case> => {
    const formData = new FormData();
    formData.append("archivo", file);
    return fetchUpload<Case>(`/api/casos/${id}/documento`, formData, token);
  },

  getDocumentUrl: async (id: number, token?: string): Promise<{ url: string; nombre: string; tipo: string }> => {
    return fetchAPI(`/api/casos/${id}/documento`, { token });
  },

  deleteDocument: async (id: number, token?: string): Promise<Case> => {
    return fetchAPI<Case>(`/api/casos/${id}/documento`, {
      method: "DELETE",
      token,
    });
  },
};

// ============================================
// ABOGADOS API
// ============================================
export const abogadosApi = {
  getAll: async (token?: string) => fetchAPI<any[]>("/api/abogados", { token }),
  create: async (data: Record<string, any>, token?: string) =>
    fetchAPI<any>("/api/abogados", { method: "POST", token, body: JSON.stringify(data) }),
  update: async (id: number, data: Record<string, any>, token?: string) =>
    fetchAPI<any>(`/api/abogados/${id}`, { method: "PUT", token, body: JSON.stringify(data) }),
};

// ============================================
// ESTUDIOS API
// ============================================
export const estudiosApi = {
  getAll: async (token?: string) => fetchAPI<any[]>("/api/estudios", { token }),
  create: async (data: Record<string, any>, token?: string) =>
    fetchAPI<any>("/api/estudios", { method: "POST", token, body: JSON.stringify(data) }),
  update: async (id: number, data: Record<string, any>, token?: string) =>
    fetchAPI<any>(`/api/estudios/${id}`, { method: "PUT", token, body: JSON.stringify(data) }),
};

// ============================================
// CALCULADORA DE PLAZOS
// ============================================
export const calculadoraApi = {
  calcular: async (data: CalcPlazoRequest, token?: string): Promise<CalcPlazoResponse> => {
    return fetchAPI<CalcPlazoResponse>("/api/calcular-plazo", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  getFeriados: async (token?: string): Promise<{ feriados: Feriado[] }> => {
    return fetchAPI<{ feriados: Feriado[] }>("/api/feriados", { token });
  },
};

// ============================================
// DOCUMENT EXTRACTION API
// ============================================
export interface ExtractDocumentResponse {
  campos: Record<string, string>;
  faltantes: string[];
  advertencias: string[];
  archivo: string;
  campos_encontrados: number;
}

export const documentApi = {
  extract: async (file: File, token?: string): Promise<ExtractDocumentResponse> => {
    const formData = new FormData();
    formData.append("archivo", file);
    return fetchUpload<ExtractDocumentResponse>(
      "/api/casos/extraer-documento",
      formData,
      token,
    );
  },
};

// ============================================
// NORMATIVA API
// ============================================
export const normativaApi = {
  buscar: async (
    query: string,
    codigos?: string[],
    topK: number = 5,
    token?: string,
  ): Promise<NormativaResponse> => {
    return fetchAPI<NormativaResponse>("/api/normativa/buscar", {
      method: "POST",
      token,
      body: JSON.stringify({ query, codigos, top_k: topK }),
    });
  },
};

// ============================================
// CASO CHAT API
// ============================================
export interface CasoChatResponse {
  respuesta: string;
}

export const casoChatApi = {
  preguntar: async (
    casoId: number,
    pregunta: string,
    token?: string,
  ): Promise<CasoChatResponse> => {
    return fetchAPI<CasoChatResponse>(`/api/casos/${casoId}/chat`, {
      method: "POST",
      token,
      body: JSON.stringify({ pregunta }),
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

// ============================================
// MULTI-DOCUMENTOS POR CASO
// ============================================
export const caseDocumentosApi = {
  list: async (casoId: number, token?: string) => {
    return fetchAPI<{ id: number; caso_id: number; nombre: string; tipo_archivo: string; fecha_subida: string }[]>(
      `/api/casos/${casoId}/documentos`,
      { token }
    );
  },

  upload: async (casoId: number, file: File, token?: string) => {
    const formData = new FormData();
    formData.append("archivo", file);
    return fetchUpload<{ id: number; caso_id: number; nombre: string; tipo_archivo: string; fecha_subida: string }>(
      `/api/casos/${casoId}/documentos`,
      formData,
      token
    );
  },

  getUrl: async (casoId: number, docId: number, token?: string): Promise<{ url: string; nombre: string; tipo: string }> => {
    return fetchAPI(`/api/casos/${casoId}/documentos/${docId}`, { token });
  },

  delete: async (casoId: number, docId: number, token?: string): Promise<void> => {
    await fetchAPI(`/api/casos/${casoId}/documentos/${docId}`, {
      method: "DELETE",
      token,
    });
  },
};
