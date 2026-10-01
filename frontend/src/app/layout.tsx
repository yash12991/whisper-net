import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { SocketProvider } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "WhisperNet — End-to-End Encrypted Communications",
  description: "Next-generation cryptographic chat platform powered by client-side RSA-3072, AES-256-GCM authenticated encryption, and forward-secret key ratcheting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark font-sans", geist.variable)}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
