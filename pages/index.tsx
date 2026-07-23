import Head from "next/head";
import HomePage from "@/components/home/HomePage";

export default function Home() {
  return (
    <>
      <Head>
        <title>ARTBYDANI7</title>
        <meta name="description" content="Independent art direction and visual archive." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f4f1ea" />
      </Head>
      <HomePage />
    </>
  );
}
