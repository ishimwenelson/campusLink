import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/hooks/useAuth";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusLink Investment Association",
  description: "Together we grow – Share, Save, Succeed",
  icons: { icon: "/assets/icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: "'Inter', sans-serif",
              borderRadius: "16px",
              border: "1px solid rgba(217,119,6,0.1)",
              backdropFilter: "blur(12px)",
              background: "rgba(255, 255, 255, 0.8)",
            },
          }}
        />
      </body>
    </html>
  );
}
