"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { FileSearch, Scale, FileText, Loader2, AlertCircle, RotateCcw, RefreshCw } from "lucide-react";
import { agentApi, type AgentRequest, type AgentResponse } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { HintTooltip } from "@/components/hint-tooltip";
import { processChildrenWithCitas } from "@/components/cita-pill";

interface LegalAgentPanelProps {
  casoId: number;
  tieneDocumentos: boolean;
}

type Accion = "analizar" | "asesorar" | "redactar";
type PanelState = "idle" | "loading" | "success" | "error";

type ActionState = {
  state: PanelState;
  resultado: AgentResponse | null;
  error: string | null;
};

const EMPTY_STATE: ActionState = { state: "idle", resultado: null, error: null };

const ACCIONES = [
  {
    id: "analizar" as Accion,
    label: "Analizar documento",
    icon: FileSearch,
    description: "Extrae y estructura los elementos del documento del caso",
    requiereDocumentos: true,
  },
  {
    id: "asesorar" as Accion,
    label: "Asesor estratégico",
    icon: Scale,
    description: "Estrategia legal, argumentos y próximos pasos",
    requiereDocumentos: false,
  },
  {
    id: "redactar" as Accion,
    label: "Redactar escrito",
    icon: FileText,
    description: "Borrador de escrito con formato legal peruano",
    requiereDocumentos: false,
  },
] as const;

const TIPOS_ESCRITO = [
  "Recurso de apelación",
  "Escrito de descargo",
  "Contestación de demanda",
  "Demanda",
  "Denuncia penal",
  "Memorial",
  "Solicitud de plazo",
  "Oficio",
];

export function LegalAgentPanel({ casoId, tieneDocumentos }: LegalAgentPanelProps) {
  const token = useAuthStore((s) => s.token);
  const [accionActiva, setAccionActiva] = useState<Accion | null>(null);
  const [actionStates, setActionStates] = useState<Record<Accion, ActionState>>({
    analizar: { ...EMPTY_STATE },
    asesorar: { ...EMPTY_STATE },
    redactar: { ...EMPTY_STATE },
  });

  const [tipoEscrito, setTipoEscrito] = useState("");
  const [destinatario, setDestinatario] = useState("");

  const isAnyLoading = Object.values(actionStates).some((s) => s.state === "loading");

  function patchAction(accion: Accion, patch: Partial<ActionState>) {
    setActionStates((prev) => ({ ...prev, [accion]: { ...prev[accion], ...patch } }));
  }

  const ejecutar = async (accion: Accion) => {
    setAccionActiva(accion);
    patchAction(accion, { state: "loading", error: null, resultado: null });

    const parametros: AgentRequest["parametros"] = {};
    if (accion === "redactar") {
      parametros.tipo_escrito = tipoEscrito;
      parametros.destinatario = destinatario;
    }

    try {
      const res = await agentApi.run(casoId, { accion, parametros }, token || "");
      patchAction(accion, { resultado: res, state: "success" });
    } catch (err) {
      patchAction(accion, {
        error: err instanceof Error ? err.message : "Error del agente. Intenta de nuevo.",
        state: "error",
      });
    }
  };

  const handleAccionClick = (accion: Accion) => {
    if (isAnyLoading) return;
    if (accion === "redactar") {
      setAccionActiva(accion);
      return;
    }
    // If already has a result or error, just switch the view — don't re-run
    if (actionStates[accion].state !== "idle") {
      setAccionActiva(accion);
    } else {
      ejecutar(accion);
    }
  };

  const activeAS = accionActiva ? actionStates[accionActiva] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-sm text-gray-500">Selecciona una acción para este caso</p>
        <HintTooltip
          text="El agente usa IA + los documentos del caso + normativa peruana. Analizar requiere documentos subidos. Asesorar y Redactar pueden funcionar solo con los datos del caso."
          position="right"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACCIONES.map(({ id, label, icon: Icon, description, requiereDocumentos }) => {
          const disabled = (requiereDocumentos && !tieneDocumentos) || isAnyLoading;
          const isActive = accionActiva === id;
          const hasResult = actionStates[id].state === "success";
          return (
            <button
              key={id}
              onClick={() => !disabled && handleAccionClick(id)}
              disabled={disabled}
              title={requiereDocumentos && !tieneDocumentos ? "Sube un documento primero" : description}
              className={`relative flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors
                ${isActive
                  ? "border-minka-500 bg-minka-50 text-minka-700"
                  : "border-gray-200 bg-white hover:border-minka-300 hover:bg-minka-50"
                }
                ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
              `}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-minka-600" : "text-minka-500"}`} />
              <span className="font-medium leading-tight">{label}</span>
              {hasResult && !isActive && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400" title="Resultado disponible" />
              )}
            </button>
          );
        })}
      </div>

      {accionActiva === "redactar" && activeAS?.state !== "success" && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
          <select
            value={tipoEscrito}
            onChange={(e) => setTipoEscrito(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">— Tipo de escrito —</option>
            {TIPOS_ESCRITO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="text"
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
            placeholder="Destinatario (ej: Señor Juez del 3er Juzgado Penal)"
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
          <button
            onClick={() => ejecutar("redactar")}
            disabled={!tipoEscrito || isAnyLoading}
            className="rounded bg-minka-500 px-3 py-1.5 text-sm text-white hover:bg-minka-600 disabled:opacity-40"
          >
            Generar borrador
          </button>
        </div>
      )}

      {activeAS?.state === "loading" && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          El agente está analizando el caso...
        </div>
      )}

      {activeAS?.state === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
          <div className="flex items-start gap-2 text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{activeAS.error}</span>
          </div>
          <button
            onClick={() => accionActiva && ejecutar(accionActiva)}
            className="mt-2 flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
          >
            <RotateCcw className="h-3 w-3" /> Reintentar
          </button>
        </div>
      )}

      {activeAS?.state === "success" && activeAS.resultado && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {activeAS.resultado.accion}
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {activeAS.resultado.tools_usados.length > 0 && (
                <span>Tools: {activeAS.resultado.tools_usados.join(", ")}</span>
              )}
              {activeAS.resultado.cached && (
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700">cached</span>
              )}
              <button
                onClick={() => accionActiva && ejecutar(accionActiva)}
                title="Volver a ejecutar"
                className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
              {accionActiva === "redactar" && (
                <button
                  onClick={() => patchAction("redactar", { ...EMPTY_STATE })}
                  title="Nuevo borrador"
                  className="text-xs text-minka-500 hover:text-minka-700"
                >
                  Nuevo
                </button>
              )}
              <button
                onClick={() => setAccionActiva(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="prose prose-sm max-w-none p-4 text-gray-800
            [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:pb-1 [&_h2]:border-b [&_h2]:border-gray-200
            [&_h3]:text-[13.5px] [&_h3]:font-semibold [&_h3]:text-gray-700 [&_h3]:mt-3 [&_h3]:mb-1
            [&_p]:text-[13px] [&_p]:leading-relaxed [&_li]:text-[13px]
            [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse
            [&_th]:bg-gray-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:border [&_th]:border-gray-200
            [&_td]:px-3 [&_td]:py-1.5 [&_td]:border [&_td]:border-gray-200 [&_td]:align-top
            [&_hr]:border-gray-200">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                p: ({ children }) => <p>{processChildrenWithCitas(children)}</p>,
                li: ({ children }) => <li>{processChildrenWithCitas(children)}</li>,
                td: ({ children }) => <td>{processChildrenWithCitas(children)}</td>,
                th: ({ children }) => <th>{processChildrenWithCitas(children)}</th>,
                strong: ({ children }) => <strong>{processChildrenWithCitas(children)}</strong>,
                em: ({ children }) => <em>{processChildrenWithCitas(children)}</em>,
              }}
            >
              {activeAS.resultado.resultado}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
