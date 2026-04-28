"use client";

import { useEffect, useState } from "react";
import { Settings, User, Bell, Building2, Save, Check, MessageCircle, Copy, AlertCircle, CheckCircle2, Trash2, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { abogadosApi, estudiosApi, type WhapiSaveResponse } from "@/lib/api";

export default function ConfiguracionPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [abogadoId, setAbogadoId] = useState<number | null>(null);
  const [estudioId, setEstudioId] = useState<number | null>(null);

  const [perfil, setPerfil] = useState({
    nombre: user?.nombre || "Daniel",
    email: user?.email || "daniel@simplifai.pe",
    telefono: "",
    colegiatura: "",
  });

  // ─── Whapi (WhatsApp) integration state ───
  const [whapiToken, setWhapiToken] = useState("");
  const [whapiTokenVisible, setWhapiTokenVisible] = useState(false);
  const [whapiSavedInfo, setWhapiSavedInfo] = useState<WhapiSaveResponse | null>(null);
  const [whapiSavedNumber, setWhapiSavedNumber] = useState("");
  const [whapiSavedChannelId, setWhapiSavedChannelId] = useState("");
  const [whapiState, setWhapiState] = useState<"idle" | "verifying" | "saving" | "error">("idle");
  const [whapiError, setWhapiError] = useState("");
  const [webhookCopied, setWebhookCopied] = useState(false);

  const [estudio, setEstudio] = useState({
    nombre: "SimplifAI Legal",
    ruc: "",
    direccion: "",
    plan: "Pro",
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

  // Persist notification prefs whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(notificaciones));
    } catch {}
  }, [notificaciones]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [abogados, estudios] = await Promise.all([
          abogadosApi.getAll(token || undefined),
          estudiosApi.getAll(token || undefined),
        ]);
        if (abogados.length > 0) {
          const a = abogados[0];
          setAbogadoId(a.id);
          setPerfil({
            nombre: a.nombre || user?.nombre || "",
            email: a.email || user?.email || "",
            telefono: a.telefono || "",
            colegiatura: a.colegiatura || "",
          });
          // Hydrate Whapi state from saved abogado
          if (a.whapi_channel_id) {
            setWhapiSavedChannelId(a.whapi_channel_id);
            setWhapiSavedNumber(a.whatsapp_numero || "");
          }
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

  // ─── Whapi handlers ───
  const handleConnectWhapi = async () => {
    if (!abogadoId) {
      setWhapiError("Primero guarda tu perfil para crear el registro de abogado.");
      setWhapiState("error");
      return;
    }
    if (!whapiToken.trim()) {
      setWhapiError("Pega el token del canal Whapi.");
      setWhapiState("error");
      return;
    }
    setWhapiState("saving");
    setWhapiError("");
    try {
      const res = await abogadosApi.saveWhapi(abogadoId, whapiToken.trim(), undefined, token || undefined);
      setWhapiSavedInfo(res);
      setWhapiSavedChannelId(res.channel_info.channel_id);
      setWhapiSavedNumber(res.channel_info.phone || "");
      setWhapiToken("");
      setWhapiState("idle");
    } catch (err) {
      setWhapiError(err instanceof Error ? err.message : "No se pudo conectar el canal");
      setWhapiState("error");
    }
  };

  const handleRefreshWhapi = async () => {
    if (!abogadoId) return;
    setWhapiState("verifying");
    setWhapiError("");
    try {
      const res = await abogadosApi.refreshWhapi(abogadoId, token || undefined);
      setWhapiSavedNumber(res.phone_actualizado || "");
      setWhapiSavedChannelId(res.channel_info.channel_id);
      if (res.cambio_detectado) {
        setWhapiError(""); // limpiar errores
        // Mostrar toast simple en errorbox como confirmación verde
      }
      setWhapiState("idle");
    } catch (err) {
      setWhapiError(err instanceof Error ? err.message : "No se pudo verificar el canal");
      setWhapiState("error");
    }
  };

  const handleDisconnectWhapi = async () => {
    if (!abogadoId) return;
    if (!confirm("¿Desconectar el canal Whapi? El bot dejará de responder mensajes.")) return;
    try {
      await abogadosApi.disconnectWhapi(abogadoId, token || undefined);
      setWhapiSavedInfo(null);
      setWhapiSavedChannelId("");
      setWhapiSavedNumber("");
    } catch (err) {
      setWhapiError(err instanceof Error ? err.message : "Error al desconectar");
      setWhapiState("error");
    }
  };

  const copyWebhookUrl = () => {
    if (!whapiSavedInfo?.webhook_url) return;
    navigator.clipboard.writeText(whapiSavedInfo.webhook_url);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2000);
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

        {/* Integración WhatsApp (Whapi) */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Integración WhatsApp</h2>
            {whapiSavedChannelId && (
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                <CheckCircle2 className="w-3 h-3" />
                Conectado
              </span>
            )}
          </div>

          <div className="p-5 space-y-4">
            {whapiSavedChannelId ? (
              // ── Estado conectado ──
              <>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm space-y-1.5">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Canal:</span>
                    <span className="font-mono text-gray-800">{whapiSavedChannelId}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Número WhatsApp:</span>
                    <span className="font-mono text-gray-800">{whapiSavedNumber || "—"}</span>
                  </div>
                </div>

                {whapiSavedInfo?.webhook_url && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-blue-900">URL de webhook (copia esto a Whapi):</p>
                    <div className="flex items-center gap-2 bg-white border border-blue-200 rounded px-2 py-1.5">
                      <code className="text-xs text-gray-700 flex-1 truncate">{whapiSavedInfo.webhook_url}</code>
                      <button
                        onClick={copyWebhookUrl}
                        className="text-blue-600 hover:text-blue-800 shrink-0"
                        title="Copiar"
                      >
                        {webhookCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-xs text-blue-700">
                      En whapi.cloud → tu canal → Settings → Webhooks → pega esta URL en "Endpoint" y activa el evento <code className="bg-blue-100 px-1 rounded">messages.post</code>.
                    </p>
                  </div>
                )}

                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 space-y-1.5">
                  <p className="font-medium">¿Vas a cambiar el número vinculado al canal?</p>
                  <p>
                    1) Re-pairea el canal en whapi.cloud (logout + nuevo QR con el otro WhatsApp). 2) Vuelve aquí y haz clic en <strong>"Verificar y actualizar"</strong> abajo. El token y la URL de webhook NO cambian.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRefreshWhapi}
                    disabled={whapiState === "verifying"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {whapiState === "verifying" ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verificando…
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Verificar y actualizar número
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDisconnectWhapi}
                    className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Desconectar canal
                  </button>
                </div>
              </>
            ) : (
              // ── Estado sin conectar ──
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                  <p className="font-medium mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Aún no has conectado tu canal de WhatsApp
                  </p>
                  <ol className="text-xs space-y-1 pl-5 list-decimal text-amber-800">
                    <li>Crea o accede a tu canal en <a href="https://whapi.cloud" target="_blank" rel="noopener noreferrer" className="underline font-medium">whapi.cloud</a> y escanea el QR con tu WhatsApp.</li>
                    <li>En el dashboard de Whapi copia el <span className="font-medium">API token</span> de tu canal.</li>
                    <li>Pega el token aquí abajo y haz clic en "Conectar canal".</li>
                    <li>Después se te mostrará la URL de webhook que debes pegar en la configuración del canal en Whapi.</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token API de Whapi
                  </label>
                  <div className="relative">
                    <input
                      type={whapiTokenVisible ? "text" : "password"}
                      value={whapiToken}
                      onChange={(e) => { setWhapiToken(e.target.value); setWhapiError(""); }}
                      placeholder="Pega aquí tu token (ej: aBcDeFgHiJkLmN...)"
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-minka-500/20 focus:border-minka-500"
                    />
                    <button
                      type="button"
                      onClick={() => setWhapiTokenVisible(!whapiTokenVisible)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title={whapiTokenVisible ? "Ocultar" : "Mostrar"}
                    >
                      {whapiTokenVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {whapiError && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {whapiError}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleConnectWhapi}
                  disabled={whapiState === "saving" || !whapiToken.trim() || !abogadoId}
                  className="px-4 py-2 bg-minka-500 text-white rounded-lg hover:bg-minka-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {whapiState === "saving" ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verificando…
                    </span>
                  ) : "Conectar canal"}
                </button>
              </>
            )}
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
