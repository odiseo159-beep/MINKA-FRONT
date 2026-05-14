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

  refresh: async (token: string): Promise<{ access_token: string; token_type: string }> => {
    return fetchAPI<{ access_token: string; token_type: string }>("/auth/refresh", {
      method: "POST",
      token,
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
export interface WhapiVerifyResponse {
  channel_id: string;
  phone: string;
  name: string;
  status: string;
}

export interface WhapiSaveResponse {
  ok: boolean;
  abogado: Record<string, any>;
  channel_info: WhapiVerifyResponse;
  webhook_url: string;
  instrucciones: string;
}

export interface WhapiStatusResponse {
  enabled: boolean;
  mensaje: string | null;
}

/** Endpoint público (sin auth) que reporta si la integración Whapi está
 *  habilitada en el backend. Si enabled=false, el frontend deshabilita el
 *  formulario y muestra el banner con el mensaje de mantenimiento. */
export const whapiStatusApi = {
  get: async (): Promise<WhapiStatusResponse> =>
    fetchAPI<WhapiStatusResponse>("/api/whapi/status", {}),
};

// ============================================
// Empresa — WhatsApp público
// ============================================
export interface EmpresaWhatsappResponse {
  numero: string;
  numero_display: string | null;
  configurado: boolean;
}

export const empresaApi = {
  /** Número público de WhatsApp de la empresa al que los abogados mandan
   *  "registrar CODIGO" para vincular su número con su cuenta. */
  getWhatsapp: async (): Promise<EmpresaWhatsappResponse> =>
    fetchAPI<EmpresaWhatsappResponse>("/api/empresa/whatsapp", {}),
};

// ============================================
// Vinculación WhatsApp del abogado (modelo single-channel)
// ============================================
export interface WhatsappCodigoResponse {
  codigo: string;
  expira_at: string;
  ttl_minutos: number;
  instrucciones: string;
  empresa_numero: string;
}

export interface WhatsappEstadoResponse {
  verificado: boolean;
  whatsapp_numero: string | null;
  whatsapp_numero_display: string;
  codigo_pendiente: boolean;
  codigo_expira_at: string | null;
}

export const whatsappAbogadoApi = {
  /** Genera un código de 10min. El abogado debe mandar "registrar CODIGO"
   *  desde su WhatsApp al número de la empresa para vincular. */
  generarCodigo: async (abogadoId: number, token?: string): Promise<WhatsappCodigoResponse> =>
    fetchAPI<WhatsappCodigoResponse>(`/api/abogados/${abogadoId}/whatsapp/codigo`, {
      method: "POST",
      token,
    }),

  /** Estado del vínculo. El frontend lo polling-ea cada 3-5s después de
   *  pedir un código para detectar cuando el abogado completó la verificación. */
  getEstado: async (abogadoId: number, token?: string): Promise<WhatsappEstadoResponse> =>
    fetchAPI<WhatsappEstadoResponse>(`/api/abogados/${abogadoId}/whatsapp/estado`, { token }),

  /** Desvincula el WhatsApp del abogado. El bot dejará de reconocerlo. */
  desvincular: async (abogadoId: number, token?: string): Promise<{ ok: boolean; mensaje: string }> =>
    fetchAPI<{ ok: boolean; mensaje: string }>(`/api/abogados/${abogadoId}/whatsapp`, {
      method: "DELETE",
      token,
    }),
};

export const abogadosApi = {
  getAll: async (token?: string) => fetchAPI<any[]>("/api/abogados", { token }),
  create: async (data: Record<string, any>, token?: string) =>
    fetchAPI<any>("/api/abogados", { method: "POST", token, body: JSON.stringify(data) }),
  update: async (id: number, data: Record<string, any>, token?: string) =>
    fetchAPI<any>(`/api/abogados/${id}`, { method: "PUT", token, body: JSON.stringify(data) }),

  verifyWhapi: async (id: number, whapiToken: string, token?: string) =>
    fetchAPI<WhapiVerifyResponse>(`/api/abogados/${id}/whapi/verificar`, {
      method: "POST",
      token,
      body: JSON.stringify({ whapi_token: whapiToken }),
    }),

  saveWhapi: async (id: number, whapiToken: string, whatsappNumero?: string, token?: string) =>
    fetchAPI<WhapiSaveResponse>(`/api/abogados/${id}/whapi`, {
      method: "POST",
      token,
      body: JSON.stringify({ whapi_token: whapiToken, whatsapp_numero: whatsappNumero }),
    }),

  disconnectWhapi: async (id: number, token?: string) =>
    fetchAPI<{ ok: boolean }>(`/api/abogados/${id}/whapi`, { method: "DELETE", token }),

  refreshWhapi: async (id: number, token?: string) =>
    fetchAPI<{
      ok: boolean;
      abogado: Record<string, any>;
      channel_info: WhapiVerifyResponse;
      phone_anterior: string | null;
      phone_actualizado: string | null;
      cambio_detectado: boolean;
    }>(`/api/abogados/${id}/whapi/refresh`, { method: "POST", token }),
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
// CORRECCIONES (Aprendizaje IA — solo admin)
// ============================================
export interface Correction {
  id: number;
  caso_id: number;
  abogado_id: number | null;
  campo: string;
  valor_claude: string | null;
  valor_abogado: string | null;
  tipo_caso: string | null;
  created_at: string;
  nombre_cliente?: string | null;
  expediente?: string | null;
}

export interface CorrectionStat {
  campo: string;
  tipo_caso: string | null;
  total: number;
  adiciones: number;
  correcciones: number;
}

export const correctionsApi = {
  list: async (
    params: { campo?: string; tipo_caso?: string; limit?: number },
    token?: string,
  ): Promise<Correction[]> => {
    const qs = new URLSearchParams();
    if (params.campo) qs.append("campo", params.campo);
    if (params.tipo_caso) qs.append("tipo_caso", params.tipo_caso);
    if (params.limit) qs.append("limit", String(params.limit));
    return fetchAPI<Correction[]>(`/api/corrections?${qs.toString()}`, { token });
  },

  stats: async (token?: string): Promise<CorrectionStat[]> => {
    return fetchAPI<CorrectionStat[]>("/api/corrections/stats", { token });
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

  historial: async (casoId: number, token?: string): Promise<{ mensajes: { role: string; content: string; timestamp: string }[] }> => {
    const res = await fetch(`${API_URL}/api/casos/${casoId}/chat/historial`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Error al cargar historial");
    return res.json();
  },

  limpiarHistorial: async (casoId: number, token?: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/casos/${casoId}/chat/historial`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Error al limpiar historial");
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

  migrarLegacy: async (casoId: number, token?: string): Promise<{
    id: number; caso_id: number; nombre: string; tipo_archivo: string; fecha_subida: string;
  }> => {
    return fetchAPI(`/api/casos/${casoId}/documentos/migrar-legacy`, {
      method: "POST",
      token,
    });
  },
};

// ============================================
// AGENT API
// ============================================
export interface AgentRequest {
  accion: "analizar" | "asesorar" | "redactar" | "normativa";
  parametros?: {
    tipo_escrito?: string;
    destinatario?: string;
    query?: string;
    tema?: string;
  };
}

export interface AgentResponse {
  accion: string;
  resultado: string;
  tools_usados: string[];
  tokens_usados: number;
  cached: boolean;
}

export const agentApi = {
  run: (casoId: number, request: AgentRequest, token: string): Promise<AgentResponse> =>
    fetchAPI<AgentResponse>(`/api/casos/${casoId}/agente`, {
      method: "POST",
      token,
      body: JSON.stringify(request),
    }),
};
