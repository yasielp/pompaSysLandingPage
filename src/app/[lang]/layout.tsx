import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { detectDevice } from "@/lib/device";
import { getDictionary, hasLocale, locales } from "@/lib/i18n";
import "../globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-figtree",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);

  return {
    metadataBase: new URL("https://pompasys.com"),
    title: dict.meta_title,
    description: dict.meta_description,
    icons: {
      icon: [
        { url: "/assets/logo-mark.svg", type: "image/svg+xml" },
        { url: "/assets/favicon-32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/assets/apple-touch-icon.png",
    },
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title: dict.meta_title,
      description: dict.meta_description,
      type: "website",
      locale: lang === "es" ? "es_ES" : "en_US",
    },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  // Reading request headers makes this render per request: the HTML already
  // arrives in the visitor's language and device class.
  const device = detectDevice((await headers()).get("user-agent"));

  return (
    <html lang={lang} data-device={device} className={figtree.variable}>
      <body>
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
