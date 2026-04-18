import type { Metadata } from "next";
import { Libre_Franklin } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const franklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Minka — Asistente Legal AI",
  description: "Mantén a tus clientes informados sobre sus casos legales 24/7 por WhatsApp",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={franklin.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
