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
        // Only apply no-cache to HTML page routes, not to _next/static assets
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
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
