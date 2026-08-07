import type { AppProps } from "next/app";
import localFont from "next/font/local";
import { Cormorant } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { Analytics } from "@vercel/analytics/next";

const geistSans = localFont({ src: "./fonts/GeistVF.woff", variable: "--font-geist-sans" });
const geistMono = localFont({ src: "./fonts/GeistMonoVF.woff", variable: "--font-geist-mono" });

// Cormorant — luxury display serif, museum-catalogue quality.
// Excellent numeral design: the "7" sits perfectly on the baseline.
const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: true,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <div
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable}`}
        style={{ minHeight: "100%", display: "contents" }}
      >
        <Component {...pageProps} />
        <Analytics />
      </div>
    </ThemeProvider>
  );
}
