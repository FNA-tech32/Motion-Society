import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Greeting } from "@/components/dashboard/Greeting";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SyncProvider } from "@/components/SyncProvider";
import { SiteFooter } from "@/components/SiteFooter";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Motion Society — your training & fuel, tuned to you",
  description:
    "Motion Society is a personal, tennis-first training and nutrition dashboard that remembers everything you tell it.",
};

export const viewport: Viewport = {
  themeColor: "#fbf3e8",
  width: "device-width",
  initialScale: 1,
};

const themeScript = `(function(){try{var t=localStorage.getItem('baseline.theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${baloo.variable} ${nunito.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <SyncProvider />
        <div className="flex min-h-dvh">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <MobileNav />
            <header className="hidden items-center justify-between px-8 py-5 md:flex">
              <Greeting />
              <ThemeToggle />
            </header>
            <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-10 pt-4 md:px-8 md:pt-0">
              {children}
            </main>
            <SiteFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
