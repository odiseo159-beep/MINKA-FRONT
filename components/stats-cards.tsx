"use client";

import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/types";

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

const metrics = [
  { key: "total" as const, label: "Total de casos", valueClass: "text-gray-800" },
  { key: "activos" as const, label: "Casos activos", valueClass: "text-blue-600" },
  { key: "resueltos" as const, label: "Resueltos", valueClass: "text-emerald-600" },
  { key: "pendientes_documento" as const, label: "Pendientes doc.", valueClass: "text-amber-600" },
];

const dividerClass = [
  "",
  "border-l border-gray-100",
  "border-t border-gray-100 lg:border-t-0 lg:border-l",
  "border-t border-l border-gray-100 lg:border-t-0",
];

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, i) => (
          <div key={metric.key} className={cn("p-6", dividerClass[i])}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {metric.label}
            </p>
            {isLoading ? (
              <div className="h-9 w-16 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className={cn("text-3xl font-bold tabular-nums tracking-tight", metric.valueClass)}>
                {stats[metric.key]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
