"use client";

import Link from "next/link";
import {
  Scale,
  LayoutDashboard,
  FolderOpen,
  Calendar,
  Users,
  BarChart3,
  Bell,
  Settings,
  MessageCircle,
  Calculator,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "/dashboard/casos", icon: FolderOpen, label: "Casos" },
  { href: "/dashboard/calendario", icon: Calendar, label: "Calendario" },
  { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
  { href: "/dashboard/reportes", icon: BarChart3, label: "Reportes" },
  { href: "/dashboard/calculadora", icon: Calculator, label: "Calculadora" },
  { href: "/dashboard/notificaciones", icon: Bell, label: "Notificaciones" },
  { href: "/dashboard/configuracion", icon: Settings, label: "Configuración" },
];

const adminItems = [
  { href: "/dashboard/aprendizaje", icon: Brain, label: "Aprendizaje IA" },
];

interface SidebarProps {
  currentPath: string;
}

export function Sidebar({ currentPath }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.rol === "admin";

  // Check if a path is active (exact match or starts with for nested routes)
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath.startsWith(href);
  };

  return (
    <aside data-tour="sidebar" className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-minka-500 rounded-xl flex items-center justify-center" aria-hidden="true">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Minka</h1>
            <p className="text-xs text-gray-500">Asistente Legal AI</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-minka-50 text-minka-700 font-semibold"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {isAdmin && (
          <>
            <p className="mt-6 mb-2 px-4 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Admin</p>
            <ul className="space-y-1">
              {adminItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-purple-50 text-purple-700 font-semibold"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="w-5 h-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* Bot status */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-lg" role="status" aria-label="Bot de WhatsApp activo">
          <div className="relative" aria-hidden="true">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-green-50 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">Bot activo</p>
            <p className="text-xs text-green-600">WhatsApp conectado</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
