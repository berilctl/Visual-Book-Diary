import { AuthForm } from "@/components/auth-form";
import { BrandMark } from "@/components/brand";

// Landing + Login/Register (PRD Bölüm 7).
// Giriş yapmış kullanıcı buraya gelirse proxy onu /dashboard'a yönlendirir.

const FEATURES = [
  {
    title: "Karakterler",
    hint: "Kim kimdi? Yüzünü, kişiliğini ve etiketlerini sakla.",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M4.8 19.6a7.4 7.4 0 0 1 14.4 0" />
      </>
    ),
  },
  {
    title: "Mekanlar",
    hint: "Hikâyenin geçtiği yerleri atmosferiyle birlikte kaydet.",
    icon: (
      <>
        <path d="M12 21.2s6.8-5.6 6.8-10.4a6.8 6.8 0 1 0-13.6 0C5.2 15.6 12 21.2 12 21.2Z" />
        <circle cx="12" cy="10.6" r="2.5" />
      </>
    ),
  },
  {
    title: "Alıntılar",
    hint: "Altını çizdiğin cümleleri sayfasıyla ve sahibiyle topla.",
    icon: (
      <>
        <path d="M9.4 6.4C6.6 7.6 4.8 10.2 4.8 13.4c0 2.3 1.5 4.2 3.6 4.2 1.9 0 3.3-1.4 3.3-3.2 0-1.8-1.3-3.1-3-3.1-.3 0-.7 0-1 .2.4-1.4 1.5-2.6 3-3.3Z" />
        <path d="M18.4 6.4c-2.8 1.2-4.6 3.8-4.6 7 0 2.3 1.5 4.2 3.6 4.2 1.9 0 3.3-1.4 3.3-3.2 0-1.8-1.3-3.1-3-3.1-.3 0-.7 0-1 .2.4-1.4 1.5-2.6 3-3.3Z" />
      </>
    ),
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12 sm:py-16">
      {/* Yerleşim: mobilde hero -> giriş kartı -> özellikler (kart ekranın hemen
          altında kalsın diye). lg'de kart sağ sütunda iki satırı kaplar. */}
      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
        <section className="max-w-xl lg:col-start-1 lg:row-start-1">
          <BrandMark />

          <p className="mt-10 text-xs font-medium uppercase tracking-[0.18em] text-gold">
            Görsel okuma günlüğü
          </p>
          <h1 className="mt-3 text-4xl leading-[1.12] text-ink sm:text-5xl">
            Okuduğun kitapları <span className="text-accent">görerek</span>{" "}
            hatırla.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink-muted">
            Karakterleri, mekanları ve altını çizdiğin cümleleri tek bir
            günlükte topla. Görselleri kendin yükle ya da betimlemeden AI ile
            ürettir.
          </p>
        </section>

        <div className="w-full max-w-sm justify-self-center lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center lg:justify-self-end">
          <AuthForm />
        </div>

        <ul className="flex max-w-xl flex-col gap-5 border-t border-line pt-8 lg:col-start-1 lg:row-start-2">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex items-start gap-4">
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                  aria-hidden
                >
                  {feature.icon}
                </svg>
              </span>
              <span>
                <span className="block font-serif text-lg leading-snug text-ink">
                  {feature.title}
                </span>
                <span className="mt-0.5 block text-sm leading-relaxed text-ink-muted">
                  {feature.hint}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
