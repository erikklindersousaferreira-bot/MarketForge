import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MarketForge",
    template: "%s | MarketForge",
  },
  description: "Plataforma de gestão para agências de marketing",
  manifest: "/manifest.json",
  applicationName: "MarketForge",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/favicon-32.png?v=2", type: "image/png", sizes: "32x32" },
      { url: "/icon.png?v=2", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png?v=2", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "MarketForge",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
