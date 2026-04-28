"use client";

import { useState } from "react";
import { Info } from "lucide-react";

interface CitaPillProps {
  dato: string;
  fuente: string;
}

/**
 * Pill inline para datos críticos del agente legal (fechas, plazos, montos,
 * artículos). El abogado puede verificar la fuente sin abrir el documento original.
 *
 * El backend genera marcadores `[[cita:dato|fuente]]` en la respuesta del agente
 * y este componente los reemplaza al renderizar el markdown. Ver `prompts.py`
 * (_CITAS_GUIDE) para el contrato de generación.
 */
export function CitaPill({ dato, fuente }: CitaPillProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-baseline">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-0.5 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[12px] font-medium text-amber-900 hover:border-amber-300 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-colors cursor-help"
        aria-label={`Cita: ${dato}. Fuente: ${fuente}`}
      >
        <span>{dato}</span>
        <Info className="h-3 w-3 text-amber-600 flex-shrink-0" />
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 z-50 -translate-x-1/2 bottom-full mb-1.5 w-64 rounded-lg bg-gray-900 px-3 py-2 text-xs leading-relaxed text-white shadow-xl pointer-events-none"
        >
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
            Fuente
          </span>
          {fuente}
          <span className="absolute left-1/2 top-full -translate-x-1/2 -mt-1 h-2 w-2 rotate-45 bg-gray-900" />
        </span>
      )}
    </span>
  );
}

/**
 * Procesa una cadena de texto reemplazando los marcadores [[cita:dato|fuente]]
 * con CitaPill components. El texto restante queda como string.
 *
 * Uso:
 *   <ReactMarkdown components={{ p: ({children}) => <p>{processChildrenWithCitas(children)}</p> }}>
 *
 * El regex acepta tanto [[cita:dato|fuente]] como [[cita:dato]] (sin fuente,
 * fallback string para que el render no se rompa si el modelo se equivoca).
 */
const CITA_REGEX = /\[\[cita:([^|\]]+)(?:\|([^\]]+))?\]\]/g;

export function processTextWithCitas(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  // reset regex state
  CITA_REGEX.lastIndex = 0;

  while ((match = CITA_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const dato = match[1].trim();
    const fuente = (match[2] || "Sin fuente especificada").trim();
    parts.push(
      <CitaPill key={`cita-${key++}-${match.index}`} dato={dato} fuente={fuente} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Helper para usar como children-mapper en componentes custom de ReactMarkdown.
 * Atraviesa los children, y si hay strings los procesa con processTextWithCitas.
 */
export function processChildrenWithCitas(
  children: React.ReactNode
): React.ReactNode {
  if (children == null) return children;
  if (typeof children === "string") return processTextWithCitas(children);
  if (Array.isArray(children)) {
    return children.map((child, i) =>
      typeof child === "string" ? (
        <span key={i}>{processTextWithCitas(child)}</span>
      ) : (
        child
      )
    );
  }
  return children;
}
