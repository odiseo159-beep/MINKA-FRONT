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
  tipo_caso: string;
  estado: string;
  proxima_fecha?: string;
  proxima_accion?: string;
  documentos_pendientes?: string;
  notas?: string;
  abogado_asignado?: string;
  documento_texto?: string;
  documento_url?: string;
  documento_nombre?: string;
  documento_tipo?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CaseDocument {
  id: number;
  caso_id: number;
  nombre: string;
  tipo_archivo: string;
  fecha_subida: string;
}

export interface CaseFormData {
  telefono: string;
  nombre_cliente: string;
  expediente?: string;
  tipo_caso: string;
  estado: string;
  proxima_fecha?: string;
  proxima_accion?: string;
  documentos_pendientes?: string;
  notas?: string;
  documento_texto?: string;
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

export interface RegisterCredentials {
  email: string;
  password: string;
  nombre: string;
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
// CALCULADORA DE PLAZOS
// ============================================
export interface CalcPlazoRequest {
  fecha_inicio: string;
  dias: number;
  tipo: "habiles" | "calendario";
}

export interface FeriadoExcluido {
  fecha: string;
  nombre: string;
}

export interface CalcPlazoResponse {
  fecha_inicio: string;
  dias_solicitados: number;
  tipo: string;
  fecha_vencimiento: string;
  dias_habiles: number;
  dias_calendario: number;
  feriados_excluidos: FeriadoExcluido[];
}

export interface Feriado {
  fecha: string;
  nombre: string;
  tipo?: string;
}

// ============================================
// NORMATIVA
// ============================================
export interface NormativaArticulo {
  citacion: string;
  texto: string;
  numero: string;
  titulo: string;
  codigo: string;
}

export interface NormativaResponse {
  articulos: NormativaArticulo[];
  total: number;
  query: string;
}

export const CODIGO_LABELS: Record<string, string> = {
  CP: "Código Penal",
  CPP: "Código Procesal Penal",
  CPC: "Código Procesal Civil",
  CC: "Código Civil",
  CEP: "Código de Ejecución Penal",
  CNA: "Código de los Niños y Adolescentes",
  CONST: "Constitución Política del Perú",
  NLPT: "Nueva Ley Procesal del Trabajo",
  L30077: "Ley 30077 - Crimen Organizado",
  L30364: "Ley 30364 - Violencia contra la Mujer",
};

// ============================================
// FILTERS
// ============================================
export interface CaseFilters {
  search: string;
  status: string;
  caseType: string;
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_FILTERS: CaseFilters = {
  search: "",
  status: "",
  caseType: "",
  dateFrom: "",
  dateTo: "",
};

// ============================================
// UI HELPERS
// ============================================
export const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  en_tramite: "En trámite",
  en_audiencia: "En audiencia",
  pendiente_documento: "Pend. documento",
  en_revision: "En revisión",
  en_apelacion: "En apelación",
  resuelto: "Resuelto",
  archivado: "Archivado",
};

export const STATUS_COLORS: Record<string, string> = {
  nuevo:               "badge-nuevo",
  en_tramite:          "badge-tramite",
  en_audiencia:        "badge-audiencia",
  pendiente_documento: "badge-pendiente",
  en_revision:         "badge-revision",
  en_apelacion:        "badge-apelacion",
  resuelto:            "badge-resuelto",
  archivado:           "badge-archivado",
};

export const CASE_TYPE_LABELS: Record<string, string> = {
  penal_estafa: "Penal - Estafa",
  penal_robo: "Penal - Robo",
  penal_lesiones: "Penal - Lesiones",
  laboral: "Laboral",
  familia_alimentos: "Familia - Alimentos",
  familia_tenencia: "Familia - Tenencia",
  civil_desalojo: "Civil - Desalojo",
  civil_otro: "Civil - Otro",
  // Backend string values
  "Alimentos": "Alimentos",
  "Penal - Estafa": "Penal - Estafa",
  "Laboral": "Laboral",
  "Civil - Desalojo": "Civil - Desalojo",
};
