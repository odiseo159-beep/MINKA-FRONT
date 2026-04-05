/**
 * quick-case.ts — Crea un caso rapido desde la terminal
 * Uso: npx tsx scripts/quick-case.ts "Juan Perez" "912345678" "Laboral" "en_tramite"
 *
 * Args: nombre telefono tipo_caso estado [expediente]
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://katia-jorkat-production.up.railway.app";

async function login(): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "daniel@simplifai.pe", password: "minka2026" }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.access_token || "";
  } catch {
    return "";
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.log("Uso: npx tsx scripts/quick-case.ts <nombre> <telefono> <tipo_caso> <estado> [expediente]");
    console.log("");
    console.log("Tipos: Alimentos, Laboral, Penal - Estafa, Civil - Desalojo");
    console.log("Estados: nuevo, en_tramite, en_audiencia, pendiente_documento, en_revision, en_apelacion, resuelto, archivado");
    console.log("");
    console.log('Ejemplo: npx tsx scripts/quick-case.ts "Juan Perez" "912345678" "Laboral" "nuevo"');
    process.exit(1);
  }

  const [nombre, telefono, tipo, estado, expediente] = args;
  const token = await login();

  const caso = {
    nombre_cliente: nombre,
    telefono,
    tipo_caso: tipo,
    estado,
    expediente: expediente || "",
    proxima_fecha: "",
    proxima_accion: "",
    documentos_pendientes: "",
    notas: "",
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/casos`, {
    method: "POST",
    headers,
    body: JSON.stringify(caso),
  });

  if (res.ok) {
    const data = await res.json();
    console.log(`Caso creado (id: ${data.id}): ${data.nombre_cliente} — ${data.tipo_caso} [${data.estado}]`);
  } else {
    const err = await res.text();
    console.error(`Error ${res.status}: ${err}`);
  }
}

main().catch(console.error);
