"use client";

import { useEffect, useState } from "react";
import { Settings, User, Bell, Building2, Save, Check } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { abogadosApi, estudiosApi } from "@/lib/api";

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

  const [estudio, setEstudio] = useState({
    nombre: "SimplifAI Legal",
    ruc: "",
    direccion: "",
    plan: "Pro",
  });

  const [notificaciones, setNotificaciones] = useState({
    emailActualizaciones: true,
    whatsappRecordatorios: true,
    alertasUrgentes: true,
    resumenSemanal: false,
  });

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
