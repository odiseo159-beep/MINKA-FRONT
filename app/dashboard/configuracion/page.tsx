"use client";

import { useEffect, useRef, useState } from "react";
import { Settings, User, Bell, Building2, Save, Check, MessageCircle, Copy, AlertCircle, CheckCircle2, Trash2, Smartphone, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import {
  abogadosApi,
  estudiosApi,
  whapiStatusApi,
  empresaApi,
  whatsappAbogadoApi,
  type WhapiStatusResponse,
  type EmpresaWhatsappResponse,
  type WhatsappCodigoResponse,
  type WhatsappEstadoResponse,
} from "@/lib/api";

export default function ConfiguracionPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [abogadoId, setAbogadoId] = useState<number | null>(null);
  const [estudioId, setEstudioId] = useState<number | null>(null);

  const [perfil, setPerfil] = useState({
    nombre: "",
    email: "",
    telefono: "",
    colegiatura: "",
  });

  // ─── WhatsApp integration state (modelo single-channel) ───
  //
  // Flujo: el abogado pide "Vincular WhatsApp" → backend genera código → UI
  // muestra el código + el número de la empresa para que mande "registrar X"
  // desde su WhatsApp → polling al endpoint /estado detecta cuando se vincula.
  const [waEmpresa, setWaEmpresa] = useState<EmpresaWhatsappResponse | null>(null);
  const [waEstado, setWaEstado] = useState<WhatsappEstadoResponse | null>(null);
  const [waCodigo, setWaCodigo] = useState<WhatsappCodigoResponse | null>(null);
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState("");
  const [waCodigoCopiado, setWaCodigoCopiado] = useState(false);
  // ref para el timer del polling, para poder limpiarlo en unmount
  const waPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Feature flag de Whapi (el backend puede tener el bot apagado por mantenimiento)
  const [whapiStatus, setWhapiStatus] = useState<WhapiStatusResponse>({ enabled: true, mensaje: null });

  const [estudio, setEstudio] = useState({
    nombre: "",
    ruc: "",
    direccion: "",
    plan: "starter",
  });

  const NOTIF_KEY = "minka_notificaciones";
  const defaultNotif = {
    emailActualizaciones: true,
    whatsappRecordatorios: true,
    alertasUrgentes: true,
    resumenSemanal: false,
  };
  const [notificaciones, setNotificaciones] = useState(defaultNotif);

  // Load notification prefs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIF_KEY);
      if (stored) setNotificaciones({ ...defaultNotif, ...JSON.parse(stored) });
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar el estado del feature flag de Whapi al montar. Si está off, ocultamos
  // el form de configuración. Falla silenciosa: si la query falla, asumimos
  // enabled=true (default conservador para no bloquear UX cuando el endpoint
  // todavía no está deployado).
  useEffect(() => {
    whapiStatusApi.get()
      .then(setWhapiStatus)
      .catch(() => setWhapiStatus({ enabled: true, mensaje: null }));
  }, []);

  // Persist notification prefs whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(notificaciones));
    } catch {}
  }, [notificaciones]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [abogados, estudios, empresa] = await Promise.all([
          abogadosApi.getAll(token || undefined),
          estudiosApi.getAll(token || undefined),
          empresaApi.getWhatsapp().catch(() => null), // si falla, queda null
        ]);
        if (empresa) setWaEmpresa(empresa);
        if (abogados.length > 0) {
          // Backend filtra por email del usuario autenticado, así que [0] es
          // el abogado del usuario actual (no de otra cuenta).
          const a = abogados[0];
          setAbogadoId(a.id);
          setPerfil({
            nombre: a.nombre || user?.nombre || "",
            email: a.email || user?.email || "",
            telefono: a.telefono || "",
            colegiatura: a.colegiatura || "",
          });
          // Cargar estado WhatsApp del abogado
          try {
            const estado = await whatsappAbogadoApi.getEstado(a.id, token || undefined);
            setWaEstado(estado);
          } catch {
            // ignore: el backend puede no estar deployado aún
          }
        } else {
          // Cuenta nueva sin abogado todavía: pre-llenar nombre/email del JWT
          // para que el usuario no tenga que retipearlos.
          setPerfil((prev) => ({
            ...prev,
            nombre: user?.nombre || "",
            email: user?.email || "",
          }));
        }
        if (estudios.length > 0) {
          const e = estudios[0];
          setEstudioId(e.id);
          setEstudio({
            nombre: e.nombre || "",
            ruc: e.ruc || "",
            direccion: e.direccion || "",
            plan: e.plan || "starter",
          });
        }
      } catch (err) {
        // silently use defaults if backend fails
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []); // only on mount

  // Polling del estado WhatsApp cuando hay un código pendiente: cada 4s
  // chequeamos si el abogado completó la verificación desde su WhatsApp.
  // Cuando se vincula (verificado=true), detenemos el polling y limpiamos
  // el código local.
  useEffect(() => {
    if (!abogadoId || !waCodigo) {
      // No hay código pendiente — limpiar timer si quedó
      if (waPollingRef.current) {
        clearInterval(waPollingRef.current);
        waPollingRef.current = null;
      }
      return;
    }
    const tick = async () => {
      try {
        const estado = await whatsappAbogadoApi.getEstado(abogadoId, token || undefined);
        setWaEstado(estado);
        if (estado.verificado) {
          // Listo: vinculado. Limpiar el código pendiente.
          setWaCodigo(null);
          if (waPollingRef.current) {
            clearInterval(waPollingRef.current);
            waPollingRef.current = null;
          }
        }
      } catch {
        // network blip — el próximo tick reintenta
      }
    };
    waPollingRef.current = setInterval(tick, 4000);
    return () => {
      if (waPollingRef.current) {
        clearInterval(waPollingRef.current);
        waPollingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abogadoId, waCodigo?.codigo]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save abogado profile
      const perfilData = { ...perfil };
      if (abogadoId) {
        await abogadosApi.update(abogadoId, perfilData, token || undefined);
      } else {
        const created = await abogadosApi.create(perfilData, token || undefined);
        setAbogadoId(created.id);
      }
      // Save estudio
      const estudioData = { nombre: estudio.nombre, ruc: estudio.ruc, direccion: estudio.direccion };
      if (estudioId) {
        await estudiosApi.update(estudioId, estudioData, token || undefined);
      } else {
        const created = await estudiosApi.create(estudioData, token || undefined);
        setEstudioId(created.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error guardando configuración:", err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Handlers de vinculación WhatsApp ───
  const handleVincularWhatsapp = async () => {
    if (!abogadoId) {
      setWaError("Primero guarda tu perfil para crear tu registro de abogado.");
      return;
    }
    setWaLoading(true);
    setWaError("");
    try {
      const res = await whatsappAbogadoApi.generarCodigo(abogadoId, token || undefined);
      setWaCodigo(res);
      // Refresh inmediato del estado para reflejar codigo_pendiente=true
      try {
        const est = await whatsappAbogadoApi.getEstado(abogadoId, token || undefined);
        setWaEstado(est);
      } catch {}
    } catch (err) {
      setWaError(err instanceof Error ? err.message : "No se pudo generar el código.");
    } finally {
      setWaLoading(false);
    }
  };

  const handleDesvincularWhatsapp = async () => {
    if (!abogadoId) return;
    if (!confirm("¿Desvincular tu WhatsApp de Minka? El bot dejará de reconocerte.")) return;
    setWaLoading(true);
    setWaError("");
    try {
      await whatsappAbogadoApi.desvincular(abogadoId, token || undefined);
      setWaCodigo(null);
      const est = await whatsappAbogadoApi.getEstado(abogadoId, token || undefined);
      setWaEstado(est);
    } catch (err) {
      setWaError(err instanceof Error ? err.message : "Error al desvincular.");
    } finally {
      setWaLoading(false);
    }
  };

  const handleCopiarCodigo = () => {
    if (!waCodigo) return;
    navigator.clipboard.writeText(`registrar ${waCodigo.codigo}`);
    setWaCodigoCopiado(true);
    setTimeout(() => setWaCodigoCopiado(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse max-w-3xl space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-32" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fadeIn max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <p className="eyebrow">Cuenta</p>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500">Gestiona tu perfil y preferencias</p>
      </div>

      <div className="space-y-6">
        {/* Perfil */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Perfil</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={perfil.nombre}
                onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-minka-500/20 focus:border-minka-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={perfil.email}
                onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-minka-500/20 focus:border-minka-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={perfil.telefono}
                onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
                placeholder="+51 999 999 999"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-minka-500/20 focus:border-minka-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° Colegiatura</label>
              <input
                type="text"
                value={perfil.colegiatura}
                onChange={(e) => setPerfil({ ...perfil, colegiatura: e.target.value })}
                placeholder="CAL-12345"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-minka-500/20 focus:border-minka-500"
              />
            </div>
          </div>
        </section>

        {/* Estudio Jurídico */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Estudio Jurídico</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del estudio</label>
              <input
                type="text"
                value={estudio.nombre}
                onChange={(e) => setEstudio({ ...estudio, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-minka-500/20 focus:border-minka-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
              <input
                type="text"
                value={estudio.ruc}
                onChange={(e) => setEstudio({ ...estudio, ruc: e.target.value })}
                placeholder="20XXXXXXXXX"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-minka-500/20 focus:border-minka-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                type="text"
                value={estudio.direccion}
                onChange={(e) => setEstudio({ ...estudio, direccion: e.target.value })}
                placeholder="Av. Ejemplo 123, Lima"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-minka-500/20 focus:border-minka-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan actual</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {estudio.plan}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* WhatsApp con Minka — modelo single-channel */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">WhatsApp con Minka</h2>
            {!whapiStatus.enabled ? (
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                <AlertCircle className="w-3 h-3" />
                En mantenimiento
              </span>
            ) : waEstado?.verificado ? (
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                <CheckCircle2 className="w-3 h-3" />
                Vinculado
              </span>
            ) : waCodigo ? (
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Esperando verificación
              </span>
            ) : null}
          </div>

          <div className="p-5 space-y-4">
            {!whapiStatus.enabled && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                <p className="font-medium mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Integración temporalmente deshabilitada
                </p>
                <p className="text-xs text-amber-800">
                  {whapiStatus.mensaje || "Estamos ajustando esta parte de la plataforma. Podrás vincular tu WhatsApp cuando vuelva a habilitarse."}
                </p>
              </div>
            )}

            {whapiStatus.enabled && waEstado?.verificado ? (
              // ── Estado vinculado ──
              <>
                <p className="text-sm text-gray-600">
                  Tu WhatsApp está vinculado a Minka. Vas a recibir recordatorios automáticos de plazos y podés preguntar sobre tus casos en cualquier momento.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-gray-500" />
                    <span className="font-mono text-gray-800">{waEstado.whatsapp_numero_display || waEstado.whatsapp_numero}</span>
                  </div>
                </div>
                <button
                  onClick={handleDesvincularWhatsapp}
                  disabled={waLoading}
                  className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Desvincular este número
                </button>
              </>
            ) : whapiStatus.enabled && waCodigo ? (
              // ── Estado: código generado, esperando que el abogado lo mande ──
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-1">Tu código</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded font-mono text-2xl text-blue-900 tracking-widest text-center">
                        {waCodigo.codigo}
                      </code>
                      <button
                        onClick={handleCopiarCodigo}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                        title="Copiar 'registrar CODIGO' al portapapeles"
                      >
                        {waCodigoCopiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-blue-900 space-y-1">
                    <p className="font-medium">Ahora desde tu WhatsApp:</p>
                    <ol className="list-decimal pl-5 text-xs space-y-1 text-blue-800">
                      <li>Abrí un chat con el número de Minka: <span className="font-mono font-medium">{waCodigo.empresa_numero ? (waEmpresa?.numero_display || waCodigo.empresa_numero) : "(pendiente de configurar)"}</span></li>
                      <li>Mandá el mensaje: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200">registrar {waCodigo.codigo}</code></li>
                      <li>En unos segundos esta pantalla se actualiza sola.</li>
                    </ol>
                  </div>
                  <p className="text-xs text-blue-700">
                    El código expira en {waCodigo.ttl_minutos} minutos. Si no llegás a tiempo, pedí uno nuevo.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleVincularWhatsapp}
                    disabled={waLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Loader2 className={`w-3.5 h-3.5 ${waLoading ? "animate-spin" : ""}`} />
                    Generar otro código
                  </button>
                  <button
                    onClick={() => setWaCodigo(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : whapiStatus.enabled ? (
              // ── Estado sin vincular ──
              <>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>
                    Vinculá tu WhatsApp con Minka para:
                  </p>
                  <ul className="list-disc pl-5 text-xs text-gray-600 space-y-0.5">
                    <li>Preguntarle al bot sobre el estado, plazos y partes de tus casos en lenguaje natural.</li>
                    <li>Recibir recordatorios automáticos de audiencias y vencimientos.</li>
                    <li>Actualizar el estado de un caso o notificar a un cliente desde el chat.</li>
                  </ul>
                </div>
                {waEmpresa && !waEmpresa.configurado && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>El equipo de SimplifAI aún no configuró el número público de Minka. Vinculá igual y te avisamos cuando esté listo, o consultá a soporte.</span>
                  </div>
                )}
                <button
                  onClick={handleVincularWhatsapp}
                  disabled={waLoading || !abogadoId}
                  className="px-4 py-2 bg-minka-500 text-white rounded-lg hover:bg-minka-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {waLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generando código…
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      Vincular mi WhatsApp
                    </>
                  )}
                </button>
                {waError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {waError}
                  </p>
                )}
              </>
            ) : null}
          </div>
        </section>

        {/* Notificaciones */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Notificaciones</h2>
          </div>
          <div className="p-5 space-y-4">
            <ToggleRow
              label="Actualizaciones por email"
              description="Recibir emails cuando hay cambios en tus casos"
              checked={notificaciones.emailActualizaciones}
              onChange={(v) => setNotificaciones({ ...notificaciones, emailActualizaciones: v })}
            />
            <ToggleRow
              label="Recordatorios por WhatsApp"
              description="Alertas de audiencias y plazos por WhatsApp"
              checked={notificaciones.whatsappRecordatorios}
              onChange={(v) => setNotificaciones({ ...notificaciones, whatsappRecordatorios: v })}
            />
            <ToggleRow
              label="Alertas urgentes"
              description="Notificaciones inmediatas para casos urgentes"
              checked={notificaciones.alertasUrgentes}
              onChange={(v) => setNotificaciones({ ...notificaciones, alertasUrgentes: v })}
            />
            <ToggleRow
              label="Resumen semanal"
              description="Recibir un resumen semanal de actividad"
              checked={notificaciones.resumenSemanal}
              onChange={(v) => setNotificaciones({ ...notificaciones, resumenSemanal: v })}
            />
          </div>
        </section>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-minka-500 text-white rounded-lg hover:bg-minka-600 transition-colors font-medium text-sm disabled:opacity-50"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Guardado
              </>
            ) : saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-minka-500" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
