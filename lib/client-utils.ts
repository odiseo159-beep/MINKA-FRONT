import type { Case } from "@/types";

export interface ClientSummary {
  nombre: string;
  telefono: string;
  totalCasos: number;
  casosActivos: number;
  ultimoCaso: Case;
  tipos: string[];
}

/**
 * Extracts unique clients from cases, grouped by telefono
 */
export function extractClients(cases: Case[]): ClientSummary[] {
  const byPhone = new Map<string, Case[]>();

  for (const caso of cases) {
    const key = caso.telefono || caso.nombre_cliente;
    const existing = byPhone.get(key) || [];
    existing.push(caso);
    byPhone.set(key, existing);
  }

  return Array.from(byPhone.entries()).map(([, clientCases]) => {
    const sorted = [...clientCases].sort((a, b) =>
      b.fecha_actualizacion.localeCompare(a.fecha_actualizacion)
    );
    const activos = clientCases.filter(
      (c) => !["resuelto", "archivado"].includes(c.estado)
    ).length;
    const tipos = [...new Set(clientCases.map((c) => c.tipo_caso))];

    return {
      nombre: sorted[0].nombre_cliente,
      telefono: sorted[0].telefono,
      totalCasos: clientCases.length,
      casosActivos: activos,
      ultimoCaso: sorted[0],
      tipos,
    };
  });
}
