"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { BarChart3, AlertTriangle, ArrowRight, Calendar, Users, Download, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useCases } from "@/hooks/use-cases";
import {
  casesByStatus,
  casesByType,
  casesByMonth,
  urgentCases,
  topClients,
  filterByPeriod,
  avgResponseTime,
} from "@/lib/report-utils";
import { STATUS_COLORS, STATUS_LABELS } from "@/types";

const PERIOD_OPTIONS = [
  { label: "30 días", value: 30 },
  { label: "3 meses", value: 90 },
  { label: "6 meses", value: 180 },
  { label: "Todo", value: null },
] as const;

const BAR_COLOR = "#6366f1";

export default function ReportesPage() {
  const { data: cases = [], isLoading } = useCases();
  const [period, setPeriod] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => filterByPeriod(cases, period), [cases, period]);
  const statusData = useMemo(() => casesByStatus(filtered), [filtered]);
  const typeData = useMemo(() => casesByType(filtered), [filtered]);
  const monthData = useMemo(() => casesByMonth(filtered), [filtered]);
  const urgent = useMemo(() => urgentCases(cases), [cases]);
  const topClientsData = useMemo(() => topClients(filtered), [filtered]);
  const responseTime = useMemo(() => avgResponseTime(filtered), [filtered]);

  const exportPDF = useCallback(async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f9fafb",
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");

      // Header
      pdf.setFillColor(192, 57, 43); // minka-500
      pdf.rect(0, 0, 210, 25, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.text("Minka — Reporte de Casos", 15, 16);
      pdf.setFontSize(10);
      pdf.text(format(new Date(), "'Generado el' d 'de' MMMM yyyy", { locale: es }), 15, 22);

      // Content
      const imgData = canvas.toDataURL("image/png");
      const contentY = 30;
      const pageHeight = 297; // A4 height
      const availableHeight = pageHeight - contentY - 10;

      if (imgHeight <= availableHeight) {
        pdf.addImage(imgData, "PNG", 0, contentY, imgWidth, imgHeight);
      } else {
        // Multi-page
        let y = 0;
        let page = 0;
        while (y < canvas.height) {
          if (page > 0) {
            pdf.addPage();
          }
          const sliceHeight = Math.min(canvas.height - y, (canvas.width * availableHeight) / imgWidth);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeight;
          const ctx = sliceCanvas.getContext("2d")!;
          ctx.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
          const sliceData = sliceCanvas.toDataURL("image/png");
          const sliceImgH = (sliceHeight * imgWidth) / canvas.width;
          pdf.addImage(sliceData, "PNG", 0, page === 0 ? contentY : 10, imgWidth, sliceImgH);
          y += sliceHeight;
          page++;
        }
      }

      pdf.save(`minka-reporte-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (err) {
      console.error("Error exporting PDF:", err);
    } finally {
      setExporting(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="animate-fadeIn">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500">Cargando datos...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 h-80 animate-pulse">
              <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
              <div className="h-full bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="animate-fadeIn">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500">Estadísticas y análisis de tus casos</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BarChart3 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Aún no hay datos para mostrar</h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Los gráficos y estadísticas aparecerán aquí una vez que registres tus primeros casos.
          </p>
          <Link
            href="/dashboard/casos?new=true"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-minka-500 text-white rounded-lg hover:bg-minka-600 transition-colors font-medium"
          >
            Crear primer caso
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500">
            {filtered.length} caso{filtered.length !== 1 ? "s" : ""} en el periodo seleccionado
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-minka-600 border border-minka-200 rounded-lg hover:bg-minka-50 transition-colors disabled:opacity-50"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-minka-200 border-t-minka-500 rounded-full animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exportar PDF
              </>
            )}
          </button>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                period === opt.value
                  ? "bg-white text-gray-900 shadow-sm font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Reportable content */}
      <div ref={reportRef}>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total casos" value={filtered.length} />
        <StatCard
          label="Activos"
          value={filtered.filter((c) => !["resuelto", "archivado"].includes(c.estado)).length}
        />
        <StatCard
          label="Resueltos"
          value={filtered.filter((c) => c.estado === "resuelto").length}
        />
        <StatCard label="Urgentes (7d)" value={urgent.length} highlight={urgent.length > 0} />
      </div>

      {/* Response time card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          Tiempo promedio de respuesta
        </h3>
        {responseTime.totalResueltos === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin datos — no hay casos resueltos o archivados</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Promedio</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{responseTime.promedioDias} <span className="text-sm font-normal text-gray-400">días</span></p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mínimo</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{responseTime.minimoDias} <span className="text-sm font-normal text-gray-400">días</span></p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Máximo</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{responseTime.maximoDias} <span className="text-sm font-normal text-gray-400">días</span></p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total resueltos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{responseTime.totalResueltos}</p>
            </div>
          </div>
        )}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pie: Cases by status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Casos por estado</h3>
          {statusData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={2}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar: Cases by type */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Casos por tipo</h3>
          {typeData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={typeData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar: Cases by month */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Casos creados por mes</h3>
          {monthData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Urgent cases */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Casos urgentes (próximos 7 días)
          </h3>
          {urgent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[250px] text-gray-400">
              <Calendar className="w-8 h-8 mb-2" />
              <p className="text-sm">Sin casos urgentes</p>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[260px] overflow-y-auto">
              {urgent.map((caso) => (
                <li key={caso.id}>
                  <Link
                    href={`/dashboard/casos/${caso.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {caso.nombre_cliente}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full ${
                            STATUS_COLORS[caso.estado] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_LABELS[caso.estado] || caso.estado}
                        </span>
                        {caso.proxima_fecha && (
                          <span className="text-xs text-gray-400">
                            {formatShortDate(caso.proxima_fecha)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-minka-500 transition-colors flex-shrink-0 ml-2" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Top clients */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          Clientes más activos
        </h3>
        {topClientsData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin datos en el periodo seleccionado</p>
        ) : (
          <div className="space-y-3">
            {topClientsData.map((client, i) => (
              <div key={client.telefono} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{client.nombre}</p>
                  <p className="text-xs text-gray-400">{client.telefono}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900">{client.totalCasos}</p>
                  <p className="text-[10px] text-gray-400">{client.casosActivos} activo{client.casosActivos !== 1 ? "s" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      </div>{/* end reportRef */}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? "text-amber-600" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyChart({ message = "Sin datos en el periodo seleccionado" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[250px] text-gray-300">
      <BarChart3 className="w-8 h-8 mb-2" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

function formatShortDate(dateStr: string): string {
  const normalized = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T");
  return format(new Date(normalized), "d MMM", { locale: es });
}
