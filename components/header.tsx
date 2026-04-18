"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { getInitials } from "@/lib/utils";
import { LogOut, User, Settings, ChevronDown, Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Inicio",
  "/dashboard/casos": "Casos",
  "/dashboard/calendario": "Calendario",
  "/dashboard/clientes": "Clientes",
  "/dashboard/reportes": "Reportes",
  "/dashboard/calculadora": "Calculadora",
  "/dashboard/notificaciones": "Notificaciones",
  "/dashboard/configuracion": "Configuración",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/dashboard/casos/")) return "Detalle del caso";
  return "Dashboard";
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const pageTitle = getPageTitle(pathname);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const displayName = user?.nombre || user?.email || "Daniel";
  const roleLabel = {
    admin: "Administrador",
    abogado: "Abogado",
    asistente: "Asistente",
  }[user?.rol || "abogado"];

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      {/* Left side - Menu button + title */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            aria-label="Abrir menú de navegación"
            aria-controls="mobile-sidebar"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
        <h2 className="text-lg font-semibold text-gray-900">{pageTitle}</h2>
      </div>

      {/* Right side - User menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={`Menú de usuario: ${displayName}`}
          className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
        >
          {/* Avatar */}
          <div className="w-9 h-9 bg-minka-500 rounded-full flex items-center justify-center text-white font-medium text-sm" aria-hidden="true">
            {getInitials(displayName)}
          </div>

          {/* User info */}
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {displayName}
            </p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>

          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div role="menu" className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-fadeIn">
            {/* User info (mobile) */}
            <div className="px-4 py-3 border-b border-gray-100 sm:hidden" aria-hidden="true">
              <p className="text-sm font-medium text-gray-900">
                {displayName}
              </p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>

            <button
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User className="w-4 h-4" aria-hidden="true" />
              Mi perfil
            </button>

            <button
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                router.push("/dashboard/configuracion");
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
              Configuración
            </button>

            <div className="border-t border-gray-100 my-1" role="separator" />

            <button
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
