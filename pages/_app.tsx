import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import localFont from "next/font/local";
import { Cormorant } from "next/font/google";
import "@/styles/globals.css";

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
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable}`}
      style={{ minHeight: "100%", display: "contents" }}
    >
      {/* key forces a re-mount on every route change, replaying the
          page-transition CSS animation defined in globals.css */}
      <div key={router.asPath} className="page-transition" style={{ display: "contents" }}>
        <Component {...pageProps} />
      </div>
    </div>
  );
}
