import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Revenue Simulator — Tether",
  description:
    "Discover your EV charging revenue potential with Tether's interactive Revenue Simulator. See projected earnings from e-credits and grid flexibility.",
  openGraph: {
    title: "The Revenue Simulator — Tether",
    description:
      "Discover your EV charging revenue potential with Tether's Revenue Simulator.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans text-brand-dark bg-brand-light antialiased">
        {children}
      </body>
    </html>
  );
}
