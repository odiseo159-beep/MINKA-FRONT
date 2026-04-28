"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Search, AlertCircle } from "lucide-react";
import { useNormativa } from "@/hooks/use-normativa";
import { CASE_TYPE_LABELS, CODIGO_LABELS } from "@/types";
import { HintTooltip } from "@/components/hint-tooltip";

const TIPO_CASO_CODIGOS: Record<string, string[]> = {
  // Penal
  penal_estafa:              ["CP", "CPP"],
  penal_robo:                ["CP", "CPP"],
  penal_lesiones:            ["CP", "CPP"],
  penal_violencia_familiar:  ["L30364", "CP", "CPP"],
  penal_homicidio:           ["CP", "CPP"],
  penal_corrupcion:          ["CP", "CPP", "L30077"],
  penal_tid:                 ["CP", "CPP", "L30077"],
  penal_lavado:              ["CP", "CPP", "L30077"],
  // Laboral
  laboral:                   ["NLPT"],
  // Familia
  familia_alimentos:         ["CC", "CNA", "CPC"],
  familia_tenencia:          ["CC", "CNA", "CPC"],
  familia_divorcio:          ["CC", "CPC"],
  // Civil
  civil_desalojo:            ["CC", "CPC"],
  civil_otro:                ["CC", "CPC"],
  sucesiones:                ["CC", "CPC"],
  inmobiliario:              ["CC", "CPC", "CONST"],
  // Administrativo
  administrativo_recurso:    ["LPAG"],
  administrativo_contencioso:["LPCA", "LPAG"],
  // Tributario
  tributario:                ["CT"],
  // Constitucional
  constitucional:            ["CONST", "CPCo"],
  // Comercial
  comercial_contrato:        ["CC"],
  comercial_societario:      ["LGS"],
};

function buildNormativaQuery(tipoCaso: string, notas?: string): string {
  const parts: string[] = [];
  const label = CASE_TYPE_LABELS[tipoCaso] || tipoCaso;
  parts.push(label);
  if (notas) {
    parts.push(notas.slice(0, 200));
  }
  return parts.join(" ");
}

interface NormativaPanelProps {
  tipoCaso: string;
  notas?: string;
}

export function NormativaPanel({ tipoCaso, notas }: NormativaPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const query = customQuery || buildNormativaQuery(tipoCaso, notas);
  const codigos = TIPO_CASO_CODIGOS[tipoCaso];

  const { data, isLoading, error } = useNormativa(
    query,
    customQuery ? undefined : codigos,
    expanded
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-minka-500" />
          <h2 className="text-lg font-semibold text-gray-900">Normativa aplicable</h2>
          <HintTooltip
            text="Artículos de los códigos peruanos más relevantes para este tipo de caso. Usa el ícono de búsqueda para buscar artículos específicos."
            position="right"
          />
          {data && data.articulos.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
              {data.articulos.length}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {expanded && (
      <div className="px-6 pb-6">
      <div className="flex items-center justify-between mb-4">
        <div />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowSearch(!showSearch); }}
          className="text-gray-400 hover:text-minka-500 transition-colors"
          title="Buscar normativa"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {showSearch && (
        <div className="mb-4">
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Buscar artículos específicos..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none text-sm"
          />
          {customQuery && (
            <button
              type="button"
              onClick={() => setCustomQuery("")}
              className="mt-1 text-xs text-minka-500 hover:underline"
            >
              Volver a sugerencias automáticas
            </button>
          )}
        </div>
      )}

      {codigos && !customQuery && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {codigos.map((codigo) => (
            <span
              key={codigo}
              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
            >
              {CODIGO_LABELS[codigo] || codigo}
            </span>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full mb-1" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>No se pudo cargar la normativa. Intenta de nuevo más tarde.</span>
        </div>
      )}

      {!isLoading && !error && data && data.articulos.length > 0 && (
        <div className="space-y-0 divide-y divide-gray-100">
          {data.articulos.map((art, i) => (
            <div key={i} className="py-3 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => setExpandedArticle(expandedArticle === i ? null : i)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 bg-minka-50 text-minka-700 rounded flex-shrink-0">
                        {art.codigo}
                      </span>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {art.citacion}
                      </p>
                    </div>
                    {art.titulo && (
                      <p className="text-sm text-gray-600 mb-0.5">{art.titulo}</p>
                    )}
                  </div>
                  {expandedArticle === i ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  )}
                </div>
              </button>

              {expandedArticle === i ? (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  {art.texto}
                </p>
              ) : (
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                  {art.texto}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && data && data.articulos.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No se encontraron artículos relevantes para este caso.
        </p>
      )}

      {!isLoading && !error && !data && (
        <p className="text-sm text-gray-400 text-center py-4">
          Ingresa datos del caso para ver normativa sugerida.
        </p>
      )}
      </div>
      )}
    </div>
  );
}
