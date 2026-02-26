import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SSH - Scientific Skills Hub",
  description: "Discover and share research skills for scientific discovery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="antialiased min-h-screen bg-background font-sans">
        <div
          className="fixed inset-0 z-[-1] bg-grid-pattern opacity-40 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="hero-glow-1 fixed z-[-1] top-[-80px] left-1/2 -translate-x-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="hero-glow-2 fixed z-[-1] top-[120px] right-[5%] pointer-events-none"
          aria-hidden="true"
        />
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
