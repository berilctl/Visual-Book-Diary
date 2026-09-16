import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

// Arayüz fontu. latin-ext, Türkçe karakterler (ğ, ş, ı, İ) için gerekli.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Başlık/alıntı fontu — kitabi, karakterli serif.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Boyamadan önce senkron çalışır: kullanıcının kayıtlı tema seçimi varsa
// <html data-theme> hemen set edilir. Olmazsa tema OS tercihine düşer.
// Seçim yoksa hiçbir şey yazılmaz — "sistem" varsayılanı korunur.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}`;

export const metadata: Metadata = {
  title: "Visual Book Diary",
  description: "Okuduğun kitapların karakter, mekan ve alıntılarını görselleştir.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: THEME_SCRIPT hydration'dan önce <html>'e
    // data-theme yazıyor; sunucu HTML'inde olmadığı için React uyarı verirdi.
    // Yalnızca bu elemanın kendi özelliklerini kapsar, alt ağacı değil.
    <html
      suppressHydrationWarning
      lang="tr"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
