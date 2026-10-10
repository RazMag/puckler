import type { Metadata } from "next";
import { Barlow_Condensed, Bungee, Graduate, VT323 } from "next/font/google";
import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";
import { CrossedSticks } from "@/components/CrossedSticks";
import "./globals.css";

const bungee = Bungee({ variable: "--font-bungee", weight: "400", subsets: ["latin"] });
const graduate = Graduate({ variable: "--font-graduate", weight: "400", subsets: ["latin"] });
const vt323 = VT323({ variable: "--font-vt323", weight: "400", subsets: ["latin"] });
const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Puckler", template: "%s · Puckler" },
  description: "Our crew's NHL picks, head to head and division by division.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bungee.variable} ${graduate.variable} ${vt323.variable} ${barlow.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col text-[17px]">
        <header className="z-30 bg-boards text-white shadow-[0_6px_0_0_var(--color-kickplate),0_14px_30px_-12px_rgb(0_0_0/0.6)] sm:sticky sm:top-0">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="group flex items-center gap-2" aria-label="Puckler home">
              <CrossedSticks className="h-9 w-9 transition-transform duration-300 group-hover:-rotate-12" />
              <span className="font-display text-2xl tracking-wide sm:text-3xl">
                PUCK<span className="text-red-line">LER</span>
              </span>
            </Link>
            <NavLinks />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-16">{children}</main>

        <footer className="bg-boards text-white/60">
          <div className="red-line" />
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-4 text-sm">
            <span>Data: NHL public API, injuries from ESPN · refreshed every minute or so</span>
            <span className="font-led text-lg text-led">KEEP YOUR STICK ON THE ICE</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
