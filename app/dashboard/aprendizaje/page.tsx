"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, AlertCircle, ArrowRight, Filter } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { correctionsApi, type Correction, type CorrectionStat } from "@/lib/api";
import { CASE_TYPE_LABELS } from "@/types";

const CAMPO_LABELS: Record<string, string> = {
  expediente: "Expediente",
  nombre_cliente: "Cliente",
  telefono: "Teléfono",
  tipo_caso: "Tipo de caso",
  estado: "Estado",
  proxima_accion: "Próxima acción",
  documentos_pendientes: "Docs pendientes",
  notas: "Notas",
  proxima_fecha: "Próxima fecha",
};

export default function AprendizajePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [stats, setStats] = useState<CorrectionStat[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCampo, setFilterCampo] = useState("");
  const [filterTipoCaso, setFilterTipoCaso] = useState("");

  // Guard: solo admins
  useEffect(() => {
    if (user && user.rol !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [s, c] = await Promise.all([
          correctionsApi.stats(token || undefined),
          correctionsApi.list(
            { campo: filterCampo || undefined, tipo_caso: filterTipoCaso || undefined, limit: 100 },
            token || undefined,
          ),
        ]);
        setStats(s);
        setCorrections(c);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar correcciones");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, filterCampo, filterTipoCaso]);

  // Agrupar stats por campo (sumando todos los tipos)
  const statsPorCampo = stats.reduce((acc, s) => {
    if (!acc[s.campo]) acc[s.campo] = { total: 0, correcciones: 0, adiciones: 0 };
    acc[s.campo].total += s.total;
    acc[s.campo].correcciones += s.correcciones;
    acc[s.campo].adiciones += s.adiciones;
    return acc;
  }, {} as Record<string, { total: number; correcciones: number; adiciones: number }>);

  const camposOrdenados = Object.entries(statsPorCampo).sort((a, b) => b[1].total - a[1].total);
  const tiposCasoEnStats = Array.from(new Set(stats.map((s) => s.tipo_caso).filter(Boolean))) as string[];

  if (user && user.rol !== "admin") {
    return null; // redirect en useEffect
  }

  return (
    <div className="animate-fadeIn max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Aprendizaje IA
          </h1>
          <p className="text-gray-500">
            Correcciones que los abogados hacen sobre la extracción automática de Claude.
            Útil para detectar dónde mejorar el parser y los prompts.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {camposOrdenados.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-700">Aún no hay correcciones registradas</p>
                <p className="text-sm mt-1">
                  Cuando los abogados modifiquen los datos extraídos por Claude al crear o editar casos,
                  esas diferencias aparecerán aquí.
                </p>
              </div>
            ) : (
              camposOrdenados.map(([campo, s]) => (
                <div key={campo} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">{CAMPO_LABELS[campo] || campo}</p>
                    <span className="text-xs text-gray-400">{s.total} {s.total === 1 ? "caso" : "casos"}</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-orange-600">↻ Correcciones</span>
                      <span className="font-mono">{s.correcciones}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">+ Adiciones</span>
                      <span className="font-mono">{s.adiciones}</span>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="bg-orange-400" style={{ width: `${(s.correcciones / s.total) * 100}%` }} />
                    <div className="bg-green-400" style={{ width: `${(s.adiciones / s.total) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Filtros + tabla */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Últimas correcciones</h2>

              <select
                value={filterCampo}
                onChange={(e) => setFilterCampo(e.target.value)}
                className="ml-auto text-xs px-2 py-1 border border-gray-200 rounded bg-white"
              >
                <option value="">Todos los campos</option>
                {Object.entries(CAMPO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>

              <select
                value={filterTipoCaso}
                onChange={(e) => setFilterTipoCaso(e.target.value)}
                className="text-xs px-2 py-1 border border-gray-200 rounded bg-white"
              >
                <option value="">Todos los tipos</option>
                {tiposCasoEnStats.map((t) => (
                  <option key={t} value={t}>{CASE_TYPE_LABELS[t as keyof typeof CASE_TYPE_LABELS] || t}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Fecha</th>
                    <th className="text-left px-5 py-3 font-medium">Caso</th>
                    <th className="text-left px-5 py-3 font-medium">Campo</th>
                    <th className="text-left px-5 py-3 font-medium">Claude extrajo</th>
                    <th className="text-left px-5 py-3 font-medium">Abogado guardó</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {corrections.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                        No hay correcciones que coincidan con el filtro.
                      </td>
                    </tr>
                  ) : (
                    corrections.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString("es-PE", {
                            day: "2-digit", month: "short",
                          })}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          <div className="font-medium text-gray-900 truncate max-w-[160px]">
                            {c.nombre_cliente || `Caso #${c.caso_id}`}
                          </div>
                          {c.expediente && (
                            <div className="text-gray-400 truncate max-w-[160px]">{c.expediente}</div>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                            {CAMPO_LABELS[c.campo] || c.campo}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs max-w-[200px]">
                          {c.valor_claude ? (
                            <span className="text-gray-600 break-words">{c.valor_claude}</span>
                          ) : (
                            <span className="text-gray-300 italic">— vacío —</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs max-w-[200px]">
                          <div className="flex items-start gap-1">
                            <ArrowRight className="w-3 h-3 mt-0.5 text-gray-300 shrink-0" />
                            <span className="text-gray-900 break-words">{c.valor_abogado || "— vacío —"}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <p className="mt-4 text-xs text-gray-400">
            Las correcciones se registran cuando el abogado modifica datos extraídos por Claude al crear o editar un caso.
            Estos datos se usan internamente para mejorar la extracción automática.
          </p>
        </>
      )}
    </div>
  );
}
