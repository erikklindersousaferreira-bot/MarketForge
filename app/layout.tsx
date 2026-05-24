import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarketForge",
  description: "Gestão de agência de marketing",
  icons: {
    icon: "https://i.postimg.cc/9Mr8QDTD/ELEMETO-preto.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}