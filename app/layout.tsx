import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./providers";
import { Header } from "./components/Header";

export const metadata: Metadata = {
  title: "Native Nature",
  description: "Native Nature website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
