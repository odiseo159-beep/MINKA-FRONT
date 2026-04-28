"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronRight } from "lucide-react";

const STORAGE_KEY = "minka_onboarding_done";
const PADDING = 12;

interface Step {
  target?: string;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
}

const STEPS: Step[] = [
  {
    title: "Bienvenido a Minka",
    body: "Tu asistente legal con IA para gestionar casos y mantener informados a tus clientes por WhatsApp. Te mostramos lo más importante.",
    placement: "center",
  },
  {
    target: "stats",
    title: "Resumen de casos",
    body: "Aquí ves tus casos activos, próximas fechas y cuántos están resueltos — todo de un vistazo.",
    placement: "bottom",
  },
  {
    target: "sidebar",
    title: "Menú de navegación",
    body: "Accede a Casos, Clientes, Calendario, Calculadora de plazos legales y más desde aquí.",
    placement: "right",
  },
  {
    target: "urgent",
    title: "Casos urgentes",
    body: "Los casos con próxima fecha dentro de los próximos 7 días aparecen aquí para que no pierdas ningún plazo.",
    placement: "top",
  },
  {
    title: "¡Listo para empezar!",
    body: "Crea tu primer caso en la sección 'Casos'. Dentro de cada caso encontrarás el Agente Legal IA: analiza documentos, asesora estratégicamente y redacta escritos completos.",
    placement: "center",
  },
];

interface SpotlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(false);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  const currentStep = STEPS[step];

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const t = setTimeout(() => setActive(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  const computePositions = useCallback(() => {
    if (!active) return;

    const target = currentStep.target;

    if (!target) {
      setSpotlight(null);
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(400px, 90vw)",
      });
      return;
    }

    const el = document.querySelector(`[data-tour="${target}"]`);
    if (!el) {
      setSpotlight(null);
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(400px, 90vw)",
      });
      return;
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    const applyPositions = () => {
      const r = el.getBoundingClientRect();
      setSpotlight({ left: r.left, top: r.top, width: r.width, height: r.height });

      const placement = currentStep.placement || "bottom";
      const tw = 320;
      const margin = 16;
      const style: React.CSSProperties = { position: "fixed", width: `${tw}px`, maxWidth: "90vw" };

      if (placement === "bottom") {
        style.top = r.bottom + margin;
        style.left = Math.max(margin, Math.min(r.left + r.width / 2 - tw / 2, window.innerWidth - tw - margin));
      } else if (placement === "top") {
        style.bottom = window.innerHeight - r.top + margin;
        style.left = Math.max(margin, Math.min(r.left + r.width / 2 - tw / 2, window.innerWidth - tw - margin));
      } else if (placement === "right") {
        style.top = Math.max(margin, r.top);
        style.left = Math.min(r.right + margin, window.innerWidth - tw - margin);
      } else if (placement === "left") {
        style.top = Math.max(margin, r.top);
        style.right = window.innerWidth - r.left + margin;
      }

      setTooltipStyle(style);
    };

    const t = setTimeout(applyPositions, 350);
    return () => clearTimeout(t);
  }, [step, active, currentStep]);

  useEffect(() => {
    const cleanup = computePositions();
    return cleanup;
  }, [computePositions]);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      localStorage.setItem(STORAGE_KEY, "true");
      setActive(false);
    }
  }, [step]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setActive(false);
  }, []);

  if (!active) return null;

  return (
    <>
      {spotlight ? (
        <svg
          className="fixed inset-0 w-full h-full pointer-events-none select-none"
          style={{ zIndex: 9000 }}
          aria-hidden="true"
        >
          <defs>
            <mask id="minka-spotlight">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={spotlight.left - PADDING}
                y={spotlight.top - PADDING}
                width={spotlight.width + PADDING * 2}
                height={spotlight.height + PADDING * 2}
                rx={10}
                fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#minka-spotlight)" />
        </svg>
      ) : (
        <div
          className="fixed inset-0 bg-black/65"
          style={{ zIndex: 9000 }}
          onClick={handleSkip}
          aria-hidden="true"
        />
      )}

      {spotlight && (
        <div
          className="fixed rounded-xl pointer-events-none"
          style={{
            zIndex: 9001,
            left: spotlight.left - PADDING,
            top: spotlight.top - PADDING,
            width: spotlight.width + PADDING * 2,
            height: spotlight.height + PADDING * 2,
            boxShadow: "0 0 0 3px #C0392B, 0 0 0 7px rgba(192,57,43,0.18)",
          }}
          aria-hidden="true"
        />
      )}

      <div
        style={{ ...tooltipStyle, zIndex: 9002 }}
        className="fixed bg-white rounded-2xl shadow-2xl border border-gray-100 p-5"
        role="dialog"
        aria-label={`Tour paso ${step + 1} de ${STEPS.length}: ${currentStep.title}`}
      >
        <div className="flex items-center gap-1 mb-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-5 bg-minka-500"
                  : i < step
                  ? "w-2 bg-minka-300"
                  : "w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>

        <p className="text-[11px] font-semibold text-minka-500 uppercase tracking-wider mb-1">
          {step + 1} / {STEPS.length}
        </p>
        <h3 className="font-semibold text-gray-900 mb-2 text-sm leading-snug">
          {currentStep.title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{currentStep.body}</p>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-1"
          >
            Saltar
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 bg-minka-500 text-white rounded-lg text-sm font-medium hover:bg-minka-600 transition-colors"
          >
            {step === STEPS.length - 1 ? "¡Empezar!" : "Siguiente"}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
