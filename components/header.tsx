"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { getInitials } from "@/lib/utils";
import { LogOut, User, Settings, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
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

  const roleLabel = {
    admin: "Administrador",
    abogado: "Abogado",
    asistente: "Asistente",
  }[user?.rol || "abogado"];

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      {/* Left side - Page title (can be dynamic) */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
      </div>

      {/* Right side - User menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
        >
          {/* Avatar */}
          <div className="w-9 h-9 bg-minka-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {getInitials(user?.nombre || user?.email)}
          </div>
          
          {/* User info */}
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {user?.nombre || user?.email}
            </p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>

          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-fadeIn">
            {/* User info (mobile) */}
            <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
              <p className="text-sm font-medium text-gray-900">
                {user?.nombre || user?.email}
              </p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to profile
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User className="w-4 h-4" />
              Mi perfil
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/dashboard/configuracion");
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
              Configuración
            </button>

            <div className="border-t border-gray-100 my-1" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
