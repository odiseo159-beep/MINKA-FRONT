"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Scale, Eye, EyeOff, AlertCircle, UserPlus } from "lucide-react";

export default function RegistroPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 10) {
      setError("La contraseña debe tener al menos 10 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);

    try {
      await register({ nombre, email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-minka-500 rounded-xl flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Minka</h1>
              <p className="text-sm text-gray-500">Asistente Legal AI</p>
            </div>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900">
              Crea tu cuenta
            </h2>
            <p className="text-gray-600 mt-1">
              Regístrate para gestionar tus casos legales con Minka
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nombre completo
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none transition-all"
                placeholder="Ej: Juan Pérez López"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none transition-all"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none transition-all pr-12"
                  placeholder="Mínimo 10 caracteres"
                  required
                  minLength={10}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minka-500 focus:border-minka-500 outline-none transition-all"
                placeholder="Repite tu contraseña"
                required
                minLength={10}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-minka-500 hover:bg-minka-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Crear cuenta
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-minka-500 hover:underline font-medium">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-minka-500 to-minka-700 items-center justify-center p-12">
        <div className="max-w-md text-center text-white">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Scale className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Tu asistente legal inteligente
          </h2>
          <p className="text-white/80 text-lg">
            Gestiona tus casos, mantén informados a tus clientes por WhatsApp
            y accede a normativa legal relevante con inteligencia artificial.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-sm text-white/70">
                Atención por WhatsApp
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold">AI</div>
              <div className="text-sm text-white/70">
                Normativa inteligente
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold">PDF</div>
              <div className="text-sm text-white/70">
                Sube tus documentos
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
