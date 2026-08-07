import { Html, Head, Main, NextScript } from "next/document";

// Synchronously resolve the stored theme before first paint so returning
// dark-mode visitors never see a flash of the light theme. Kept dependency-free
// and inlined so it runs render-blocking, ahead of hydration.
const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem("artbydani7-theme");if(t!=="light"&&t!=="dark"){t="light";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
