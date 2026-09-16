import { AuthForm } from "@/components/auth-form";
import { BrandMark } from "@/components/brand";
import {
  CharacterIcon,
  LocationIcon,
  QuoteIcon,
} from "@/components/ui/icons";

// Landing + Login/Register (PRD Bölüm 7).
// Giriş yapmış kullanıcı buraya gelirse proxy onu /dashboard'a yönlendirir.

const FEATURES = [
  {
    title: "Karakterler",
    hint: "Kim kimdi? Yüzünü, kişiliğini ve etiketlerini sakla.",
    Icon: CharacterIcon,
  },
  {
    title: "Mekanlar",
    hint: "Hikâyenin geçtiği yerleri atmosferiyle birlikte kaydet.",
    Icon: LocationIcon,
  },
  {
    title: "Alıntılar",
    hint: "Altını çizdiğin cümleleri sayfasıyla ve sahibiyle topla.",
    Icon: QuoteIcon,
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
            günlükte topla; her birini kendi seçtiğin görsellerle canlandır.
          </p>
        </section>

        <div className="w-full max-w-sm justify-self-center lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center lg:justify-self-end">
          <AuthForm />
        </div>

        <ul className="flex max-w-xl flex-col gap-5 border-t border-line pt-8 lg:col-start-1 lg:row-start-2">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex items-start gap-4">
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <feature.Icon />
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
