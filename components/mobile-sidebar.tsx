"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Scale,
  LayoutDashboard,
  FolderOpen,
  Calendar,
  Users,
  BarChart3,
  Settings,
  MessageCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "/dashboard/casos", icon: FolderOpen, label: "Casos" },
  { href: "/dashboard/calendario", icon: Calendar, label: "Calendario" },
  { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
  { href: "/dashboard/reportes", icon: BarChart3, label: "Reportes" },
  { href: "/dashboard/configuracion", icon: Settings, label: "Configuración" },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

export function MobileSidebar({ isOpen, onClose, currentPath }: MobileSidebarProps) {
  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return currentPath === "/dashboard";
    return currentPath.startsWith(href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl flex flex-col animate-slideIn">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-minka-500 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Minka</h1>
              <p className="text-xs text-gray-500">Asistente Legal AI</p>
            </div>
          </Link>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-minka-50 text-minka-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bot status */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-lg">
            <div className="relative">
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
    </div>
  );
}
