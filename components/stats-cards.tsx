"use client";

import { FolderOpen, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import type { DashboardStats } from "@/types";

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

const cards = [
  {
    key: "total" as const,
    label: "Total de casos",
    icon: FolderOpen,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  {
    key: "activos" as const,
    label: "Casos activos",
    icon: TrendingUp,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    key: "resueltos" as const,
    label: "Resueltos",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    key: "pendientes_documento" as const,
    label: "Pendientes doc.",
    icon: AlertCircle,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
];

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="bg-white rounded-xl border border-gray-200 p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className={`text-2xl font-bold ${card.color}`}>
                  {stats[card.key]}
                </p>
              )}
            </div>
            <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
