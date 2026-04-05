/**
 * check-api.ts — Verifica conexion con el backend
 * Uso: npx tsx scripts/check-api.ts
 *
 * Chequea: health, auth, casos endpoint
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://katia-jorkat-production.up.railway.app";

async function run() {
  console.log(`Verificando API: ${API_URL}\n`);

  // 1. Health
  await check("Health (root)", () => fetch(`${API_URL}/`));

  // 2. Auth login — save token for subsequent checks
  let token = "";
  await check("Auth Login", async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "daniel@simplifai.pe", password: "minka2026" }),
    });
    if (res.ok) {
      const data = await res.json();
      token = data.access_token || "";
      // Return a new Response so we can still print status
      return new Response(JSON.stringify({ ok: true, token: token.slice(0, 20) + "..." }), { status: 200 });
    }
    return res;
  });

  // 3. Auth verify
  await check("Auth Verify", () =>
    fetch(`${API_URL}/auth/verificar`, {
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
  );

  // 4. Listar casos (con auth)
  await check("Listar Casos", () =>
    fetch(`${API_URL}/api/casos`, {
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
  );

  console.log("\nDone.");
}

async function check(name: string, fn: () => Promise<Response>) {
  const start = Date.now();
  try {
    const res = await fn();
    const ms = Date.now() - start;
    const body = await res.text();
    const preview = body.length > 80 ? body.slice(0, 80) + "..." : body;
    const icon = res.ok ? "OK " : "ERR";
    console.log(`  ${icon} ${name.padEnd(22)} ${String(res.status).padEnd(6)} ${String(ms + "ms").padEnd(8)} ${preview}`);
  } catch (e: any) {
    const ms = Date.now() - start;
    console.log(`  ERR ${name.padEnd(22)} ${"FAIL".padEnd(6)} ${String(ms + "ms").padEnd(8)} ${e.message}`);
  }
}

run().catch(console.error);
