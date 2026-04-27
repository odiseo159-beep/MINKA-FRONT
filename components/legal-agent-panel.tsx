"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { FileSearch, Scale, FileText, BookOpen, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { agentApi, type AgentRequest, type AgentResponse } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

interface LegalAgentPanelProps {
  casoId: number;
  tieneDocumentos: boolean;
}

type Accion = "analizar" | "asesorar" | "redactar" | "normativa";
type PanelState = "idle" | "loading" | "success" | "error";

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
  {
    id: "normativa" as Accion,
    label: "Buscar normativa",
    icon: BookOpen,
    description: "Artículos del CP, CPP, CC, NLPT, Ley 30364, etc.",
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
  const [state, setState] = useState<PanelState>("idle");
  const [resultado, setResultado] = useState<AgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tipoEscrito, setTipoEscrito] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [queryNormativa, setQueryNormativa] = useState("");

  const ejecutar = async (accion: Accion) => {
    setAccionActiva(accion);
    setState("loading");
    setError(null);
    setResultado(null);

    const parametros: AgentRequest["parametros"] = {};
    if (accion === "redactar") {
      parametros.tipo_escrito = tipoEscrito;
      parametros.destinatario = destinatario;
    } else if (accion === "normativa") {
      parametros.query = queryNormativa;
    }

    try {
      const res = await agentApi.run(casoId, { accion, parametros }, token || "");
      setResultado(res);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error del agente. Intenta de nuevo.");
      setState("error");
    }
  };

  const reintentar = () => {
    if (accionActiva) ejecutar(accionActiva);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACCIONES.map(({ id, label, icon: Icon, description, requiereDocumentos }) => {
          const disabled = (requiereDocumentos && !tieneDocumentos) || state === "loading";
          const isActive = accionActiva === id;
          return (
            <button
              key={id}
              onClick={() => {
                if (id === "redactar" || id === "normativa") {
                  setAccionActiva(id);
                  setState("idle");
                } else {
                  ejecutar(id);
                }
              }}
              disabled={disabled}
              title={requiereDocumentos && !tieneDocumentos ? "Sube un documento primero" : description}
              className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors
                ${isActive && state === "loading"
                  ? "border-minka-500 bg-minka-50 text-minka-700"
                  : "border-gray-200 bg-white hover:border-minka-300 hover:bg-minka-50"
                }
                ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
              `}
            >
              <Icon className="h-4 w-4 text-minka-500" />
              <span className="font-medium leading-tight">{label}</span>
            </button>
          );
        })}
      </div>

      {accionActiva === "redactar" && state !== "success" && (
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
            disabled={!tipoEscrito || state === "loading"}
            className="rounded bg-minka-500 px-3 py-1.5 text-sm text-white hover:bg-minka-600 disabled:opacity-40"
          >
            Generar borrador
          </button>
        </div>
      )}

      {accionActiva === "normativa" && state !== "success" && (
        <div className="flex gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <input
            type="text"
            value={queryNormativa}
            onChange={(e) => setQueryNormativa(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && queryNormativa && ejecutar("normativa")}
            placeholder="ej: plazo prescripción estafa, art 387 peculado..."
            className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
          <button
            onClick={() => ejecutar("normativa")}
            disabled={!queryNormativa || state === "loading"}
            className="rounded bg-minka-500 px-3 py-1.5 text-sm text-white hover:bg-minka-600 disabled:opacity-40"
          >
            Buscar
          </button>
        </div>
      )}

      {state === "loading" && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          El agente está analizando el caso...
        </div>
      )}

      {state === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
          <div className="flex items-start gap-2 text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={reintentar}
            className="mt-2 flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
          >
            <RotateCcw className="h-3 w-3" /> Reintentar
          </button>
        </div>
      )}

      {state === "success" && resultado && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {resultado.accion}
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {resultado.tools_usados.length > 0 && (
                <span>Tools: {resultado.tools_usados.join(", ")}</span>
              )}
              {resultado.cached && (
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700">cached</span>
              )}
              <button
                onClick={() => { setState("idle"); setAccionActiva(null); setResultado(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="prose prose-sm max-w-none p-4 text-gray-800">
            <ReactMarkdown>{resultado.resultado}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
