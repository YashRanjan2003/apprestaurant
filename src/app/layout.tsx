import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from '@/lib/context/CartContext';
import { AuthProvider } from '@/lib/context/AuthContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Restaurant App",
  description: "Mobile restaurant ordering and reservation platform",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#000000",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Restaurant App",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900 min-h-screen`}>
        <AuthProvider>
          <CartProvider>
            <div className="max-w-md mx-auto min-h-screen bg-white shadow-sm">
              {children}
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
