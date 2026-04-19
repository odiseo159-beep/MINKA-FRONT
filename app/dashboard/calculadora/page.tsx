"use client";

import { useState } from "react";
import { Calculator, Calendar, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { calculadoraApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { CalcPlazoResponse, Feriado } from "@/types";

type TipoCalculo = "habiles" | "calendario";

const PLAZOS_COMUNES = [
  { label: "3 días hábiles", dias: 3, tipo: "habiles" as TipoCalculo },
  { label: "5 días hábiles", dias: 5, tipo: "habiles" as TipoCalculo },
  { label: "10 días hábiles", dias: 10, tipo: "habiles" as TipoCalculo },
  { label: "15 días hábiles", dias: 15, tipo: "habiles" as TipoCalculo },
  { label: "30 días hábiles", dias: 30, tipo: "habiles" as TipoCalculo },
  { label: "30 días calendario", dias: 30, tipo: "calendario" as TipoCalculo },
  { label: "60 días calendario", dias: 60, tipo: "calendario" as TipoCalculo },
  { label: "90 días calendario", dias: 90, tipo: "calendario" as TipoCalculo },
];

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function getDayOfWeek(isoDate: string) {
  const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const d = new Date(isoDate + "T12:00:00");
  return days[d.getDay()];
}

export default function CalculadoraPage() {
  const { token } = useAuthStore();

  const today = new Date().toISOString().split("T")[0];
  const [fechaInicio, setFechaInicio] = useState(today);
  const [dias, setDias] = useState<number>(10);
  const [tipo, setTipo] = useState<TipoCalculo>("habiles");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<CalcPlazoResponse | null>(null);
  const [showFeriados, setShowFeriados] = useState(false);
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [loadingFeriados, setLoadingFeriados] = useState(false);
  const [feriadosVisible, setFeriadosVisible] = useState(false);

  async function handleCalcular() {
    if (!fechaInicio || !dias || dias < 1) return;
    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const res = await calculadoraApi.calcular(
        { fecha_inicio: fechaInicio, dias, tipo },
        token ?? undefined
      );
      setResultado(res);
    } catch (e: any) {
      setError(e.message || "Error al calcular el plazo");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerFeriados() {
    if (feriadosVisible) {
      setFeriadosVisible(false);
      return;
    }
    setLoadingFeriados(true);
    try {
      const res = await calculadoraApi.getFeriados(token ?? undefined);
      setFeriados(res.feriados);
      setFeriadosVisible(true);
    } catch {
      // silencioso
    } finally {
      setLoadingFeriados(false);
    }
  }

  function applyPreset(preset: (typeof PLAZOS_COMUNES)[number]) {
    setDias(preset.dias);
    setTipo(preset.tipo);
    setResultado(null);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="eyebrow">Herramientas</p>
        <h1 className="text-2xl font-bold text-gray-900">Calculadora de plazos</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Calcula fechas de vencimiento descontando fines de semana y feriados peruanos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            {/* Fecha de inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => { setFechaInicio(e.target.value); setResultado(null); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-minka-500 focus:border-transparent"
              />
            </div>

            {/* Número de días */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de días
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={dias}
                onChange={(e) => { setDias(parseInt(e.target.value) || 1); setResultado(null); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-minka-500 focus:border-transparent"
              />
            </div>

            {/* Tipo de plazo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de plazo
              </label>
              <div className="flex gap-3">
                {(["habiles", "calendario"] as TipoCalculo[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTipo(t); setResultado(null); }}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                      tipo === t
                        ? "bg-minka-500 text-white border-minka-500"
                        : "bg-white text-gray-600 border-gray-300 hover:border-minka-300"
                    }`}
                  >
                    {t === "habiles" ? "Días hábiles" : "Días calendario"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {tipo === "habiles"
                  ? "Se excluyen sábados, domingos y feriados peruanos."
                  : "Se cuentan todos los días corridos del calendario."}
              </p>
            </div>

            {/* Botón calcular */}
            <button
              onClick={handleCalcular}
              disabled={loading || !fechaInicio || dias < 1}
              className="w-full bg-minka-500 hover:bg-minka-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Calculando..." : "Calcular vencimiento"}
            </button>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Resultado */}
          {resultado && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Resultado
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Fecha de inicio</p>
                  <p className="text-lg font-bold text-gray-900">{formatDate(resultado.fecha_inicio)}</p>
                  <p className="text-xs text-gray-400 capitalize">{getDayOfWeek(resultado.fecha_inicio)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-900/20 ring-2 ring-gray-900/20">
                  <p className="text-xs text-gray-500 mb-1">Fecha de vencimiento</p>
                  <p className="text-lg font-bold text-minka-600">{formatDate(resultado.fecha_vencimiento)}</p>
                  <p className="text-xs text-gray-400 capitalize">{getDayOfWeek(resultado.fecha_vencimiento)}</p>
                </div>
              </div>

              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Clock className="w-4 h-4 text-minka-500" />
                  <span><strong>{resultado.dias_habiles}</strong> días hábiles</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span><strong>{resultado.dias_calendario}</strong> días calendario</span>
                </div>
              </div>

              {resultado.feriados_excluidos.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowFeriados(!showFeriados)}
                    className="flex items-center gap-1 text-xs text-minka-600 hover:underline"
                  >
                    {showFeriados ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {resultado.feriados_excluidos.length} feriado
                    {resultado.feriados_excluidos.length !== 1 ? "s" : ""} excluido
                    {resultado.feriados_excluidos.length !== 1 ? "s" : ""}
                  </button>
                  {showFeriados && (
                    <ul className="mt-2 space-y-1">
                      {resultado.feriados_excluidos.map((f) => (
                        <li key={f.fecha} className="text-xs text-gray-600 flex gap-2">
                          <span className="font-mono text-minka-600">{formatDate(f.fecha)}</span>
                          <span>{f.nombre}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="space-y-5">
          {/* Plazos comunes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Plazos comunes</h3>
            <div className="space-y-1.5">
              {PLAZOS_COMUNES.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-gray-100 hover:text-gray-900 text-gray-600 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feriados del año */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Feriados Perú</h3>
              <button
                onClick={handleVerFeriados}
                disabled={loadingFeriados}
                className="text-xs text-minka-600 hover:underline disabled:opacity-50"
              >
                {loadingFeriados ? "Cargando..." : feriadosVisible ? "Ocultar" : "Ver todos"}
              </button>
            </div>
            {feriadosVisible && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {feriados
                  .filter((f) => f.fecha >= today)
                  .slice(0, 20)
                  .map((f) => (
                    <div key={f.fecha} className="flex gap-2 text-xs">
                      <span className="font-mono text-minka-600 shrink-0">{formatDate(f.fecha)}</span>
                      <span className="text-gray-600">{f.nombre}</span>
                    </div>
                  ))}
                {feriados.filter((f) => f.fecha >= today).length === 0 && (
                  <p className="text-xs text-gray-400">No hay feriados próximos.</p>
                )}
              </div>
            )}
            {!feriadosVisible && (
              <p className="text-xs text-gray-400">
                Lista de feriados oficiales 2024–2027.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
