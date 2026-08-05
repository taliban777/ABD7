import Head from "next/head";
import Link from "next/link";
import { GlobalNav } from "@/components/nav/GlobalNav";
import styles from "@/components/not-found/not-found.module.css";

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Not Found — ARTBYDANI7</title>
        <meta name="description" content="The page you are looking for does not exist." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <GlobalNav projects={[]} />
      <main className={styles.page}>
        <div className={styles.inner}>
          <span className={styles.code}>404</span>
          <h1 className={styles.title}>Page not found</h1>
          <p className={styles.body}>
            The page you are looking for does not exist or has been moved.
          </p>
          <Link href="/" className={styles.link}>
            Return home
          </Link>
        </div>
      </main>
    </>
  );
}
