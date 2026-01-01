import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ImpersonationBanner } from "./components/ImpersonationBanner";
import { ToastProvider } from "./components/Toast";
import { auth } from "@/auth";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Native Nature",
  description: "Native Nature website",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  
  return (
    <html lang="en" className={poppins.variable}>
      <body className="flex flex-col min-h-screen font-sans">
        <AuthProvider>
          <ToastProvider>
            {session?.user?.isImpersonating && (
              <ImpersonationBanner 
                userName={session.user.name || session.user.email || 'User'} 
                userId={session.user.id}
              />
            )}
            <Header session={session} />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
