import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { I18nProvider } from "@/components/i18n-provider";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import "./globals.css";

// Interface font. latin-ext is required for Turkish characters (ğ, ş, ı, İ).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Display font for headings and quotes.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Runs synchronously before the first paint: if the user picked a theme, it is
// applied to <html data-theme> right away. With no stored choice nothing is
// written and the theme follows the OS preference.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}`;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: "Visual Book Diary", description: t.meta.description };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    // suppressHydrationWarning: the theme script writes data-theme onto <html>
    // before hydration, which React would otherwise report as a mismatch. It
    // covers this element's own attributes only, not the subtree.
    <html
      suppressHydrationWarning
      lang={locale}
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
