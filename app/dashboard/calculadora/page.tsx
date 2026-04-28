"use client";

import { useState, useEffect } from "react";
import { Calculator, Calendar, Clock, AlertCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { calculadoraApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { CalcPlazoResponse, Feriado } from "@/types";
import { OnboardingTour } from "@/components/onboarding-tour";
import { DateInputPE } from "@/components/date-input-pe";

const CALC_TOUR_STEPS = [
  {
    target: "calc-form",
    title: "Calculadora de plazos",
    body: "Ingresa la fecha de inicio, el número de días y el tipo de plazo. La calculadora descuenta fines de semana y feriados peruanos automáticamente.",
    placement: "bottom" as const,
  },
  {
    target: "calc-presets",
    title: "Plazos comunes",
    body: "Un clic aplica los plazos más usados en procesos peruanos: 3, 5, 10, 15 o 30 días hábiles, entre otros.",
    placement: "left" as const,
  },
];

type TipoCalculo = "habiles" | "calendario";

const PLAZOS_COMUNES = [
  { label: "3 días hábiles",     dias: 3,  tipo: "habiles"   as TipoCalculo },
  { label: "5 días hábiles",     dias: 5,  tipo: "habiles"   as TipoCalculo },
  { label: "10 días hábiles",    dias: 10, tipo: "habiles"   as TipoCalculo },
  { label: "15 días hábiles",    dias: 15, tipo: "habiles"   as TipoCalculo },
  { label: "30 días hábiles",    dias: 30, tipo: "habiles"   as TipoCalculo },
  { label: "30 días calendario", dias: 30, tipo: "calendario" as TipoCalculo },
  { label: "60 días calendario", dias: 60, tipo: "calendario" as TipoCalculo },
  { label: "90 días calendario", dias: 90, tipo: "calendario" as TipoCalculo },
];

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function getDayOfWeek(isoDate: string) {
  const days = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  return days[new Date(isoDate + "T12:00:00").getDay()];
}

export default function CalculadoraPage() {
  const { token } = useAuthStore();
  const now = new Date();

  const [fechaInicio, setFechaInicio] = useState(now.toISOString().split("T")[0]);
  const [dias, setDias]           = useState<number>(10);
  const [tipo, setTipo]           = useState<TipoCalculo>("habiles");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [resultado, setResultado] = useState<CalcPlazoResponse | null>(null);
  const [showFeriadosExcl, setShowFeriadosExcl] = useState(false);

  // Feriados panel
  const [allFeriados, setAllFeriados]   = useState<Feriado[]>([]);
  const [feriadosMes, setFeriadosMes]   = useState<Feriado[]>([]);
  const [viewYear, setViewYear]         = useState(now.getFullYear());
  const [viewMonth, setViewMonth]       = useState(now.getMonth()); // 0-based

  // Load all feriados on mount
  useEffect(() => {
    calculadoraApi.getFeriados(token ?? undefined)
      .then((res) => setAllFeriados(res.feriados))
      .catch(() => {});
  }, [token]);

  // Filter feriados when month/year changes
  useEffect(() => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const prefix = `${viewYear}-${mm}`;
    setFeriadosMes(allFeriados.filter((f) => f.fecha.startsWith(prefix)));
  }, [allFeriados, viewMonth, viewYear]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

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
          <div data-tour="calc-form" className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            {/* Fecha de inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de inicio
              </label>
              <DateInputPE
                value={fechaInicio}
                onChange={(iso) => { setFechaInicio(iso); setResultado(null); }}
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
                <div className="bg-white rounded-lg p-4 border border-minka-200 ring-2 ring-minka-100">
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

              {resultado.feriados_excluidos?.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowFeriadosExcl(!showFeriadosExcl)}
                    className="flex items-center gap-1 text-xs text-minka-600 hover:underline"
                  >
                    {showFeriadosExcl ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {resultado.feriados_excluidos.length} feriado
                    {resultado.feriados_excluidos.length !== 1 ? "s" : ""} excluido
                    {resultado.feriados_excluidos.length !== 1 ? "s" : ""}
                  </button>
                  {showFeriadosExcl && (
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
          <div data-tour="calc-presets" className="bg-white rounded-xl border border-gray-200 p-5">
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

          {/* Feriados por mes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            {/* Navegación de mes */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-semibold text-gray-700">
                {MESES[viewMonth]} {viewYear}
              </h3>
              <button
                onClick={nextMonth}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {allFeriados.length === 0 ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : feriadosMes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">
                Sin feriados en {MESES[viewMonth].toLowerCase()}.
              </p>
            ) : (
              <ul className="space-y-2">
                {feriadosMes.map((f) => (
                  <li key={f.fecha} className="flex gap-2 items-start text-xs">
                    <span className="font-mono text-minka-600 shrink-0 mt-0.5">
                      {formatDate(f.fecha)}
                    </span>
                    <span className="text-gray-700 leading-tight">{f.nombre}</span>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-[10px] text-gray-300 mt-3 text-center">
              Feriados oficiales Perú 2024–2027
            </p>
          </div>
        </div>
      </div>

      <OnboardingTour steps={CALC_TOUR_STEPS} storageKey="minka_tour_calculadora" />
    </div>
  );
}
