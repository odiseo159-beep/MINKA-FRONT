"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { PrivacyModal } from "@/components/privacy-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show privacy modal on first access after authentication
  useEffect(() => {
    if (isAuthenticated) {
      const accepted = localStorage.getItem("minka_privacidad_aceptada");
      if (!accepted) {
        setShowPrivacy(true);
      }
    }
  }, [isAuthenticated]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div role="status" className="text-center">
          <div className="w-10 h-10 border-4 border-minka-200 border-t-minka-500 rounded-full animate-spin mx-auto mb-4" aria-hidden="true" />
          <p className="text-sm text-gray-500">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface flex">
      <PrivacyModal
        open={showPrivacy}
        onAccept={() => {
          localStorage.setItem("minka_privacidad_aceptada", "true");
          setShowPrivacy(false);
        }}
      />

      {/* Desktop sidebar */}
      <Sidebar currentPath={pathname} />

      {/* Mobile sidebar */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentPath={pathname}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
