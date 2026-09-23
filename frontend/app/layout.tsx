import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PHARMA AI — Pharmaceutical Research, Powered by AI",
  description:
    "AI-Enhanced PBPK + QbD + Personalized Drug Delivery Digital Twin. Computational biopharmaceutics, mechanistic pharmacokinetics, virtual populations, and machine learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-pharma-text antialiased selection:bg-pharma-primary/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
