import { describe, it, expect, vi, beforeEach } from "vitest";
import { casesApi, authApi } from "@/lib/api";

// ---------------------------------------------------------------------------
// Mock global fetch
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();
global.fetch = mockFetch;

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ---------------------------------------------------------------------------
// authApi
// ---------------------------------------------------------------------------
describe("authApi", () => {
  it("login sends POST with email and password", async () => {
    const payload = { access_token: "tok123", token_type: "bearer", usuario: { id: 1, email: "a@b.com", rol: "admin", activo: true, fecha_creacion: "" } };
    mockFetch.mockResolvedValueOnce(jsonResponse(payload));

    const result = await authApi.login({ email: "a@b.com", password: "pass" });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/auth/login");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({ email: "a@b.com", password: "pass" });
    expect(result.access_token).toBe("tok123");
  });

  it("verify sends Authorization header when token provided", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ autenticado: true }));

    await authApi.verify("my-token");

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers["Authorization"]).toBe("Bearer my-token");
  });

  it("verify omits Authorization header when no token", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ autenticado: false }));

    await authApi.verify();

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers["Authorization"]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// casesApi
// ---------------------------------------------------------------------------
describe("casesApi", () => {
  it("getAll calls /api/casos with auth header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([]));

    const result = await casesApi.getAll("tok");

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/casos");
    expect(opts.headers["Authorization"]).toBe("Bearer tok");
    expect(result).toEqual([]);
  });

  it("create sends POST with body", async () => {
    const newCase = { telefono: "912345678", nombre_cliente: "Test", tipo_caso: "laboral", estado: "nuevo" };
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1, ...newCase, fecha_creacion: "", fecha_actualizacion: "" }));

    await casesApi.create(newCase, "tok");

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/casos");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual(newCase);
  });

  it("update sends PUT to /api/casos/:id", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 5 }));

    await casesApi.update(5, { estado: "resuelto" }, "tok");

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/casos/5");
    expect(opts.method).toBe("PUT");
  });

  it("delete sends DELETE to /api/casos/:id", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));

    await casesApi.delete(3, "tok");

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/casos/3");
    expect(opts.method).toBe("DELETE");
  });

  it("notify sends POST to /api/casos/:id/notificar", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ mensaje: "Enviado" }));

    const result = await casesApi.notify(7, "tok");

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/casos/7/notificar");
    expect(opts.method).toBe("POST");
    expect(result.mensaje).toBe("Enviado");
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
describe("API error handling", () => {
  it("throws with detail message on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ detail: "No autorizado" }, 401));

    await expect(casesApi.getAll("bad")).rejects.toThrow("No autorizado");
  });

  it("throws generic error when response has no detail", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("parse fail")),
    });

    await expect(casesApi.getAll()).rejects.toThrow("Error desconocido");
  });
});
