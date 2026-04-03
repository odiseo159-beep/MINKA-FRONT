// ============================================
// CASO (Case)
// ============================================
export type CaseStatus = 
  | "nuevo"
  | "en_tramite"
  | "en_audiencia"
  | "pendiente_documento"
  | "en_revision"
  | "en_apelacion"
  | "resuelto"
  | "archivado";

export type CaseType =
  | "penal_estafa"
  | "penal_robo"
  | "penal_lesiones"
  | "laboral"
  | "familia_alimentos"
  | "familia_tenencia"
  | "civil_desalojo"
  | "civil_otro";

export interface Case {
  id: number;
  telefono: string;
  nombre_cliente: string;
  expediente?: string;
  tipo_caso: CaseType;
  estado: CaseStatus;
  proxima_fecha?: string;
  proxima_accion?: string;
  documentos_pendientes?: string;
  notas?: string;
  abogado_asignado?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CaseFormData {
  telefono: string;
  nombre_cliente: string;
  expediente?: string;
  tipo_caso: CaseType;
  estado: CaseStatus;
  proxima_fecha?: string;
  proxima_accion?: string;
  documentos_pendientes?: string;
  notas?: string;
}

// ============================================
// USER & AUTH
// ============================================
export type UserRole = "admin" | "abogado" | "asistente";

export interface User {
  id: number;
  email: string;
  nombre?: string;
  rol: UserRole;
  activo: boolean;
  fecha_creacion: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  usuario: User;
}

// ============================================
// API RESPONSES
// ============================================
export interface ApiError {
  detail: string;
}

export interface VerifyResponse {
  autenticado: boolean;
  email?: string;
  nombre?: string;
  rol?: UserRole;
}

// ============================================
// DASHBOARD STATS
// ============================================
export interface DashboardStats {
  total: number;
  activos: number;
  resueltos: number;
  pendientes_documento: number;
}

// ============================================
// UI HELPERS
// ============================================
export const STATUS_LABELS: Record<CaseStatus, string> = {
  nuevo: "Nuevo",
  en_tramite: "En trámite",
  en_audiencia: "En audiencia",
  pendiente_documento: "Pend. documento",
  en_revision: "En revisión",
  en_apelacion: "En apelación",
  resuelto: "Resuelto",
  archivado: "Archivado",
};

export const STATUS_COLORS: Record<CaseStatus, string> = {
  nuevo: "bg-blue-100 text-blue-800",
  en_tramite: "bg-amber-100 text-amber-800",
  en_audiencia: "bg-purple-100 text-purple-800",
  pendiente_documento: "bg-yellow-100 text-yellow-800",
  en_revision: "bg-cyan-100 text-cyan-800",
  en_apelacion: "bg-pink-100 text-pink-800",
  resuelto: "bg-green-100 text-green-800",
  archivado: "bg-gray-100 text-gray-800",
};

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  penal_estafa: "Penal - Estafa",
  penal_robo: "Penal - Robo",
  penal_lesiones: "Penal - Lesiones",
  laboral: "Laboral",
  familia_alimentos: "Familia - Alimentos",
  familia_tenencia: "Familia - Tenencia",
  civil_desalojo: "Civil - Desalojo",
  civil_otro: "Civil - Otro",
};
