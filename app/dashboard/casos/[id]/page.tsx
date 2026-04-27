"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCase, useUpdateCase, useNotifyClient } from "@/hooks/use-cases";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, formatRelativeTime, getDateUrgencyClass } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS, CASE_TYPE_LABELS } from "@/types";
import {
  ArrowLeft,
  Edit2,
  MessageSquare,
  Phone,
  Calendar,
  FileText,
  Clock,
  User,
  Scale,
  Lock,
  Sparkles,
} from "lucide-react";
import { NormativaPanel } from "@/components/normativa-panel";
import { CasoChatPanel } from "@/components/caso-chat-panel";
import { DocumentosPanel } from "@/components/documentos-panel";
import { LegalAgentPanel } from "@/components/legal-agent-panel";
import { casesApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useDocumentosCaso } from "@/hooks/use-documentos";

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const { data: caso, isLoading, error } = useCase(id);
  const { data: documentosNuevos } = useDocumentosCaso(id);
  const notifyClient = useNotifyClient();
  const { toast } = useToast();
  const token = useAuthStore((state) => state.token);

  const [aiSeedQuery, setAiSeedQuery] = useState<string | undefined>(undefined);
  const chatSectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"detalle" | "agente">("detalle");

  const triggerAiAction = (query: string) => {
    setActiveTab("detalle");
    setAiSeedQuery(query);
    setTimeout(() => chatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleNotify = async () => {
    if (!caso) return;
    if (!confirm(`¿Enviar notificación a ${caso.nombre_cliente} por WhatsApp?`)) return;
    
    try {
      await notifyClient.mutateAsync({
        id: caso.id,
        nombreCliente: caso.nombre_cliente,
        telefono: caso.telefono,
      });
      toast({ title: "Notificación enviada", description: `Se notificó a ${caso.nombre_cliente}` });
    } catch (err) {
      toast({ 
        title: "Error", 
        description: "No se pudo enviar la notificación",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-64 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-32 mb-8" />
          <div className="grid grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-5 bg-gray-200 rounded w-40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !caso) {
    return (
      <div className="text-center py-12">
        <Scale className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Caso no encontrado</h2>
        <p className="text-gray-500 mb-4">El caso que buscas no existe o fue eliminado.</p>
        <Link
          href="/dashboard/casos"
          className="text-minka-500 hover:text-minka-600"
        >
          ← Volver a casos
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/casos"
            aria-label="Volver a casos"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>
          <div>
            <p className="eyebrow">{caso.expediente ? `Expediente · ${caso.expediente}` : "Detalle del caso"}</p>
            <h1 className="text-2xl font-bold text-gray-900">{caso.nombre_cliente}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleNotify}
            disabled={notifyClient.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            {notifyClient.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
                Notificar por WhatsApp
              </>
            )}
          </button>
          <Link
            href={`/dashboard/casos?edit=${caso.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-minka-500 text-white rounded-lg hover:bg-minka-600 transition-colors"
          >
            <Edit2 className="w-4 h-4" aria-hidden="true" />
            Editar
          </Link>
        </div>
      </div>

      {/* AI Synthesis panel */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-minka-500" aria-hidden="true" />
          <p className="eyebrow" style={{ color: "hsl(var(--ring))" }}>Síntesis del caso · Minka</p>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {CASE_TYPE_LABELS[caso.tipo_caso] || caso.tipo_caso} a favor de <strong>{caso.nombre_cliente}</strong>.{" "}
          Estado actual: <strong>{STATUS_LABELS[caso.estado]}</strong>.{" "}
          {caso.proxima_accion && <>Próxima acción: {caso.proxima_accion}{caso.proxima_fecha ? ` (${formatDate(caso.proxima_fecha)})` : ""}. </>}
          {caso.notas && <>{caso.notas.slice(0, 140)}{caso.notas.length > 140 ? "…" : ""}</>}
          {!caso.proxima_accion && !caso.notas && "Sin notas adicionales registradas."}
        </p>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab navigation */}
          <div className="flex gap-1 border-b border-gray-200">
            {([
              { id: "detalle", label: "Detalle" },
              { id: "agente", label: "⚖️ Agente Legal" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? "border-minka-500 text-minka-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "agente" && (
            <div className="p-4">
              <LegalAgentPanel
                casoId={caso.id}
                tieneDocumentos={
                  !!caso.documento_texto || !!caso.documento_url || (documentosNuevos?.length ?? 0) > 0
                }
              />
            </div>
          )}

          {activeTab === "detalle" && <>
          {/* Status card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Información del caso</h2>
              <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${STATUS_COLORS[caso.estado]}`}>
                {STATUS_LABELS[caso.estado]}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tipo de caso</p>
                <p className="font-medium text-gray-900">
                  {CASE_TYPE_LABELS[caso.tipo_caso] || caso.tipo_caso}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Próxima fecha</p>
                <p className={`font-medium ${getDateUrgencyClass(caso.proxima_fecha)}`}>
                  {formatDate(caso.proxima_fecha) || "No definida"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Próxima acción</p>
                <p className="font-medium text-gray-900">
                  {caso.proxima_accion || "No definida"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Última actualización</p>
                <p className="font-medium text-gray-900">
                  {formatRelativeTime(caso.fecha_actualizacion)}
                </p>
              </div>
            </div>
          </div>

          {/* Documentos del caso (multi-doc) */}
          <DocumentosPanel
            casoId={caso.id}
            legacyDoc={caso.documento_url && caso.documento_nombre ? { nombre: caso.documento_nombre } : null}
          />

          {/* Documents */}
          {caso.documentos_pendientes && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-amber-500" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-gray-900">Documentos pendientes</h2>
              </div>
              <p className="text-gray-600 whitespace-pre-wrap">{caso.documentos_pendientes}</p>
            </div>
          )}

          {/* Internal notes */}
          {caso.notas && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-amber-600" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-amber-900">Notas internas</h2>
              </div>
              <p className="text-amber-800 whitespace-pre-wrap">{caso.notas}</p>
              <p className="text-xs text-amber-600 mt-4">
                Estas notas no se comparten con el cliente
              </p>
            </div>
          )}

          {/* Normativa aplicable */}
          <NormativaPanel tipoCaso={caso.tipo_caso} notas={caso.notas} />

          {/* Chat con IA */}
          <div ref={chatSectionRef}>
            <CasoChatPanel
              casoId={caso.id}
              tieneDocumento={!!caso.documento_texto || !!caso.documento_url || (documentosNuevos?.length ?? 0) > 0}
              seedQuery={aiSeedQuery}
              onSeedConsumed={() => setAiSeedQuery(undefined)}
            />
          </div>
          </>}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-400" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Cliente</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Nombre</p>
                <p className="font-medium text-gray-900">{caso.nombre_cliente}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Teléfono</p>
                <a 
                  href={`https://wa.me/51${caso.telefono}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-medium text-green-600 hover:text-green-700"
                >
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  +51 {caso.telefono}
                </a>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-400" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900">Historial</h2>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-minka-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Caso creado</p>
                  <p className="text-xs text-gray-500">{formatDate(caso.fecha_creacion)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Última actualización</p>
                  <p className="text-xs text-gray-500">{formatRelativeTime(caso.fecha_actualizacion)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-minka-500" aria-hidden="true" />
              <h2 className="text-base font-semibold text-gray-900">Acciones IA</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: "Próximos pasos", query: "¿Cuáles son los próximos pasos recomendados en este caso?" },
                { label: "Preparar alegatos", query: "Ayúdame a preparar los argumentos principales para el siguiente paso procesal de este caso." },
                { label: "Buscar precedentes", query: "¿Qué jurisprudencia peruana es relevante para este tipo de caso?" },
                { label: "Analizar riesgos", query: "¿Cuáles son los principales riesgos procesales en este caso y cómo mitigarlos?" },
              ].map(({ label, query }) => (
                <button
                  key={label}
                  onClick={() => triggerAiAction(query)}
                  className="w-full text-left text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2.5 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
