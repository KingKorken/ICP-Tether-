import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
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
    <html lang="en" className={nunitoSans.variable}>
      <body className="font-sans text-brand-text bg-brand-dark antialiased">
        {children}
      </body>
    </html>
  );
}
