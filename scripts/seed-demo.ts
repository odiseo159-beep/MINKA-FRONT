/**
 * seed-demo.ts — Inserta datos demo en el backend via API
 * Uso: npx tsx scripts/seed-demo.ts
 * Limpiar: npx tsx scripts/seed-demo.ts --clean
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://katia-jorkat-production.up.railway.app";

const DEMO_CASES = [
  {
    telefono: "912345678",
    nombre_cliente: "Maria Garcia Lopez",
    expediente: "EXP-2026-0142",
    tipo_caso: "Alimentos",
    estado: "en_tramite",
    proxima_fecha: "2026-04-10",
    proxima_accion: "Audiencia de conciliacion",
    documentos_pendientes: "Boletas de pago ultimos 3 meses",
    notas: "Cliente solicita pension de alimentos para 2 hijos menores.",
  },
  {
    telefono: "923456789",
    nombre_cliente: "Carlos Mendoza Rios",
    expediente: "EXP-2026-0087",
    tipo_caso: "Penal - Estafa",
    estado: "en_audiencia",
    proxima_fecha: "2026-04-08",
    proxima_accion: "Juicio oral - segunda sesion",
    documentos_pendientes: "Peritaje contable, testimoniales de testigos 3 y 4",
    notas: "Caso de estafa por S/ 45,000. Acusado tiene antecedentes.",
  },
  {
    telefono: "934567890",
    nombre_cliente: "Ana Lucia Vargas",
    expediente: "EXP-2026-0201",
    tipo_caso: "Laboral",
    estado: "nuevo",
    proxima_fecha: "2026-04-15",
    proxima_accion: "Presentar demanda ante juzgado laboral",
    documentos_pendientes: "Contrato de trabajo, boletas de pago, liquidacion",
    notas: "Despido arbitrario de empresa minera. Trabajó 5 anos.",
  },
  {
    telefono: "945678901",
    nombre_cliente: "Roberto Huaman Torres",
    expediente: "EXP-2025-0892",
    tipo_caso: "Civil - Desalojo",
    estado: "pendiente_documento",
    proxima_fecha: "2026-04-12",
    proxima_accion: "Presentar escritura publica notarizada",
    documentos_pendientes: "Escritura publica del inmueble, contrato de arrendamiento vencido",
    notas: "Inquilino no paga hace 8 meses. Propiedad en Miraflores.",
  },
  {
    telefono: "956789012",
    nombre_cliente: "Patricia Sanchez Medina",
    expediente: "EXP-2026-0156",
    tipo_caso: "Alimentos",
    estado: "resuelto",
    proxima_fecha: "",
    proxima_accion: "",
    documentos_pendientes: "",
    notas: "Caso resuelto. Pension fijada en 30% de ingresos del demandado.",
  },
  {
    telefono: "967890123",
    nombre_cliente: "Jorge Castillo Flores",
    expediente: "EXP-2026-0178",
    tipo_caso: "Penal - Estafa",
    estado: "en_revision",
    proxima_fecha: "2026-04-20",
    proxima_accion: "Revision de apelacion por sala penal",
    documentos_pendientes: "Escrito de apelacion fundamentado",
    notas: "Sentencia de primera instancia desfavorable. Apelamos.",
  },
  {
    telefono: "978901234",
    nombre_cliente: "Luciana Paredes Gutierrez",
    expediente: "EXP-2026-0210",
    tipo_caso: "Laboral",
    estado: "en_tramite",
    proxima_fecha: "2026-04-18",
    proxima_accion: "Audiencia de juzgamiento",
    documentos_pendientes: "Certificado de trabajo, correos de hostigamiento",
    notas: "Demanda por hostigamiento laboral y discriminacion.",
  },
  {
    telefono: "912345678",
    nombre_cliente: "Maria Garcia Lopez",
    expediente: "EXP-2025-0650",
    tipo_caso: "Civil - Desalojo",
    estado: "archivado",
    proxima_fecha: "",
    proxima_accion: "",
    documentos_pendientes: "",
    notas: "Caso anterior. Desalojo resuelto por conciliacion. Archivado.",
  },
  {
    telefono: "989012345",
    nombre_cliente: "Fernando Quispe Mamani",
    expediente: "EXP-2026-0225",
    tipo_caso: "Penal - Estafa",
    estado: "nuevo",
    proxima_fecha: "2026-04-22",
    proxima_accion: "Denuncia ante fiscalia",
    documentos_pendientes: "Contrato falsificado, transferencias bancarias",
    notas: "Estafa piramidal. Victima perdio S/ 120,000.",
  },
  {
    telefono: "990123456",
    nombre_cliente: "Sofia Delgado Rojas",
    expediente: "EXP-2026-0198",
    tipo_caso: "Alimentos",
    estado: "en_apelacion",
    proxima_fecha: "2026-04-25",
    proxima_accion: "Vista de causa en sala superior",
    documentos_pendientes: "Informe social actualizado",
    notas: "Apelacion de sentencia que fijo pension baja (15%).",
  },
  {
    telefono: "923456789",
    nombre_cliente: "Carlos Mendoza Rios",
    expediente: "EXP-2026-0240",
    tipo_caso: "Laboral",
    estado: "en_tramite",
    proxima_fecha: "2026-04-28",
    proxima_accion: "Conciliacion administrativa en SUNAFIL",
    documentos_pendientes: "Calculo de beneficios sociales",
    notas: "Reclamo de CTS y gratificaciones no pagadas por 2 anos.",
  },
  {
    telefono: "901234567",
    nombre_cliente: "Diego Ramirez Vega",
    expediente: "EXP-2026-0255",
    tipo_caso: "Civil - Desalojo",
    estado: "en_tramite",
    proxima_fecha: "2026-04-06",
    proxima_accion: "Inspeccion judicial del inmueble",
    documentos_pendientes: "",
    notas: "Desalojo por ocupacion precaria. Inmueble comercial. Urgente.",
  },
];

async function login(): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "daniel@simplifai.pe",
      password: "minka2026",
    }),
  });
  if (!res.ok) {
    // Try without auth — backend may have REQUIRE_AUTH=false
    return "";
  }
  const data = await res.json();
  return data.access_token || "";
}

function headers(token: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function seed() {
  console.log(`API: ${API_URL}`);
  const token = await login();
  console.log(token ? "Autenticado" : "Sin auth (REQUIRE_AUTH=false)");

  console.log(`\nInsertando ${DEMO_CASES.length} casos demo...`);
  let ok = 0;
  let fail = 0;

  for (const caso of DEMO_CASES) {
    try {
      const res = await fetch(`${API_URL}/api/casos`, {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify(caso),
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`  + ${data.nombre_cliente} — ${data.tipo_caso} (${data.estado})`);
        ok++;
      } else {
        const err = await res.text();
        console.error(`  x ${caso.nombre_cliente}: ${res.status} ${err}`);
        fail++;
      }
    } catch (e: any) {
      console.error(`  x ${caso.nombre_cliente}: ${e.message}`);
      fail++;
    }
  }

  console.log(`\n${ok} insertados, ${fail} fallidos.`);
}

async function clean() {
  console.log(`API: ${API_URL}`);
  const token = await login();

  const res = await fetch(`${API_URL}/api/casos`, { headers: headers(token) });
  const cases: any[] = await res.json();

  const demoNames = new Set(DEMO_CASES.map((c) => c.nombre_cliente));
  const toDelete = cases.filter((c: any) => demoNames.has(c.nombre_cliente));

  console.log(`Eliminando ${toDelete.length} casos demo...`);
  let deleted = 0;
  for (const c of toDelete) {
    const r = await fetch(`${API_URL}/api/casos/${c.id}`, {
      method: "DELETE",
      headers: headers(token),
    });
    if (r.ok) {
      console.log(`  - ${c.nombre_cliente} (id: ${c.id})`);
      deleted++;
    }
  }
  console.log(`\n${deleted} casos eliminados.`);
}

// --- Main ---
const args = process.argv.slice(2);
if (args.includes("--clean")) {
  clean().catch(console.error);
} else {
  seed().catch(console.error);
}
