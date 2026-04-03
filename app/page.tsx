"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth().then((authenticated) => {
      if (authenticated) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    });
  }, [checkAuth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-minka-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando Minka...</p>
      </div>
    </div>
  );
}
