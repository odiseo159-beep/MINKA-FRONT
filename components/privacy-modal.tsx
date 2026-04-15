"use client";

import { Scale } from "lucide-react";

interface PrivacyModalProps {
  open: boolean;
  onAccept: () => void;
}

export function PrivacyModal({ open, onAccept }: PrivacyModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      // No onClick handler — modal is blocking
    >
      <div
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-minka-50 flex items-center justify-center">
            <Scale className="w-7 h-7 text-minka-500" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-1">
          Aviso de Privacidad
        </h2>
        <p className="text-xs text-gray-400 text-center mb-6 uppercase tracking-wide">
          Ley N° 29733 — Protección de Datos Personales
        </p>

        {/* Body */}
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Al continuar, aceptas que Minka procesa datos de tus casos legales
          para brindarte asistencia mediante inteligencia artificial. Tus
          documentos se almacenan cifrados. No compartimos información con
          terceros salvo los proveedores tecnológicos indicados en nuestra
          política de privacidad (Anthropic para IA, Cloudflare para
          almacenamiento).
        </p>
        <p className="text-sm text-gray-600 leading-relaxed mb-8">
          Tus datos están protegidos bajo la{" "}
          <span className="font-medium text-gray-800">
            Ley N° 29733 — Ley de Protección de Datos Personales del Perú
          </span>
          .
        </p>

        {/* Policy link */}
        <div className="text-center mb-6">
          <a
            href="/politica-privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-minka-500 hover:text-minka-600 underline underline-offset-2"
          >
            Ver política completa
          </a>
        </div>

        {/* Accept button */}
        <button
          onClick={onAccept}
          className="w-full py-3 px-6 bg-minka-500 hover:bg-minka-600 text-white font-medium rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-minka-500 focus:ring-offset-2"
        >
          Acepto y continuar
        </button>
      </div>
    </div>
  );
}
