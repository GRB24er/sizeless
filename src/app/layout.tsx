import type { Metadata } from "next";
import { Inter, Mona_Sans, IBM_Plex_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const mona = Mona_Sans({ variable: "--font-mona", subsets: ["latin"], axes: ["wdth"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });
// The admin dashboard keeps Inter; only loaded on pages that use it.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], preload: false });

const description =
  "Secure shipping and precious-metals vault custody. Every charge is itemized from a published rate card and fixed when you book.";

export const metadata: Metadata = {
  title: "Aegis Cargo | Secure Shipping & Vault Services",
  description,
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Aegis Cargo | Secure Shipping & Vault Services",
    description,
    url: "https://www.aegiscargo.org",
    siteName: "Aegis Cargo",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${mona.variable} ${plexMono.variable} ${inter.variable} font-sans antialiased`}>
        <noscript dangerouslySetInnerHTML={{ __html: "<style>[data-reveal]{opacity:1!important;transform:none!important}</style>" }} />
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
