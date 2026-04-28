"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";

interface HintTooltipProps {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function HintTooltip({ text, position = "top", className = "" }: HintTooltipProps) {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 -mt-1",
    bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1",
    right: "right-full top-1/2 -translate-y-1/2 -mr-1",
    left: "left-full top-1/2 -translate-y-1/2 -ml-1",
  };

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        className="text-gray-300 hover:text-gray-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-minka-500 rounded-full"
        aria-label="Más información"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {visible && (
        <div
          className={`absolute z-50 w-52 bg-gray-900 text-white text-xs rounded-lg px-3 py-2.5 shadow-xl leading-relaxed pointer-events-none ${positionClasses[position]}`}
          role="tooltip"
        >
          {text}
          <span
            className={`absolute w-2 h-2 bg-gray-900 rotate-45 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </span>
  );
}
