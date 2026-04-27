/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Environment variables that will be available in the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Prevent browser from caching stale HTML pages in development
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          // Previene clickjacking — la app no debe embeberse en iframes externos
          { key: "X-Frame-Options", value: "DENY" },
          // Evita que el navegador adivine el content-type (MIME sniffing)
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Activa el filtro XSS del navegador (legacy, complementa CSP)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // No enviar Referer a sitios externos
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Solo carga recursos del mismo origen + el backend en Railway
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://katia-jorkat-production.up.railway.app",
              "font-src 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Redirect root to dashboard if needed
  async redirects() {
    return [];
  },
};

module.exports = nextConfig;
