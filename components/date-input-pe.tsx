"use client";

import { forwardRef, useEffect, useState } from "react";

// El input nativo type="date" de Chrome muestra mm/dd/yyyy en SO/navegador en
// inglés ignorando lang="es-PE" del documento. Para una audiencia peruana
// sustituimos por un text input que siempre muestra dd/mm/aaaa, manejando
// auto-formato al escribir y aceptando paste en formato ISO (yyyy-mm-dd).
//
// API: value/onChange usan ISO (yyyy-mm-dd) para mantener compatibilidad con
// el resto del frontend (form data, payloads al backend, getDateUrgencyClass).
//
// Trade-off conocido: pierde el calendar popup nativo. Si en el futuro lo
// necesitamos, agregar un botón de calendario que abra un date input oculto.

interface Props
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value?: string;
  onChange: (iso: string) => void;
}

export const DateInputPE = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, ...rest }, ref) => {
    const [text, setText] = useState(() => isoToDdmm(value));

    useEffect(() => {
      setText(isoToDdmm(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // Paste ISO yyyy-mm-dd (lo emite el browser cuando alguien pega "2026-05-15")
      const isoPaste = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
      if (isoPaste) {
        const display = `${isoPaste[3].padStart(2, "0")}/${isoPaste[2].padStart(2, "0")}/${isoPaste[1]}`;
        setText(display);
        const iso = ddmmToIso(display);
        if (iso) onChange(iso);
        return;
      }

      let cleaned = raw.replace(/[^\d/]/g, "");

      // Auto-insert slashes mientras escribe (no al borrar)
      if (cleaned.length > text.length) {
        const digits = cleaned.replace(/\D/g, "");
        if (digits.length >= 5) {
          cleaned = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
        } else if (digits.length >= 3) {
          cleaned = `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
        }
      }
      if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
      setText(cleaned);

      if (cleaned === "") {
        onChange("");
        return;
      }
      const iso = ddmmToIso(cleaned);
      if (iso) onChange(iso);
    };

    return (
      <input
        ref={ref}
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="dd/mm/aaaa"
        inputMode="numeric"
        maxLength={10}
        autoComplete="off"
        {...rest}
      />
    );
  }
);
DateInputPE.displayName = "DateInputPE";

function isoToDdmm(iso?: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function ddmmToIso(ddmm: string): string {
  const m = ddmm.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  const day = m[1].padStart(2, "0");
  const mon = m[2].padStart(2, "0");
  const year = m[3];
  const dayN = Number(day);
  const monN = Number(mon);
  const yearN = Number(year);
  if (monN < 1 || monN > 12 || dayN < 1 || dayN > 31 || yearN < 1900) return "";
  // Rechaza fechas inválidas tipo 31/02/2026
  const date = new Date(yearN, monN - 1, dayN);
  if (date.getMonth() !== monN - 1 || date.getDate() !== dayN) return "";
  return `${year}-${mon}-${day}`;
}
