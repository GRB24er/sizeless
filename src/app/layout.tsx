import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aegis Cargo — Global Shipping & Vault Services",
  description: "Enterprise-grade logistics, worldwide shipping, real-time tracking, and secure gold vault storage. Trusted by businesses across 190+ countries.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Aegis Cargo — Global Shipping & Vault Services",
    description: "Enterprise-grade logistics, worldwide shipping, real-time tracking, and secure gold vault storage.",
    url: "https://www.aegiscargo.org",
    siteName: "Aegis Cargo",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <SessionProvider refetchInterval={60 * 60} refetchOnWindowFocus={false}>
          <main>{children}</main>
          <Toaster />
        </SessionProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/69b584e896a7f41c3840d9b6/1jjmgubch';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
