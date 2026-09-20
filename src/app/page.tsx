import { AuthForm } from "@/components/auth-form";
import { BrandMark } from "@/components/brand";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  CharacterIcon,
  LocationIcon,
  QuoteIcon,
} from "@/components/ui/icons";
import { getDictionary } from "@/lib/i18n/server";

// Landing page with the sign-in / sign-up form.
// Signed-in visitors are redirected to /dashboard by the proxy.

export default async function Home() {
  const t = await getDictionary();
  const features = [
    { ...t.landing.features.characters, Icon: CharacterIcon },
    { ...t.landing.features.locations, Icon: LocationIcon },
    { ...t.landing.features.quotes, Icon: QuoteIcon },
  ];

  return (
    <main className="relative flex flex-1 items-center justify-center px-6 py-16">
      {/* Language and theme are reachable before signing in — the landing page has no header. */}
      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6">
        <LocaleToggle />
        <ThemeToggle />
      </div>

      {/* Layout: on mobile hero -> auth card -> features, so the card stays near
          the top of the screen. On lg the card spans two rows in the right column. */}
      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
        <section className="max-w-xl lg:col-start-1 lg:row-start-1">
          <BrandMark />

          <p className="mt-10 text-xs font-medium uppercase tracking-[0.18em] text-gold">
            {t.landing.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl leading-[1.12] text-ink sm:text-5xl">
            {t.landing.titleBefore}
            <span className="text-accent">{t.landing.titleHighlight}</span>
            {t.landing.titleAfter}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink-muted">
            {t.landing.lead}
          </p>
        </section>

        <div className="w-full max-w-sm justify-self-center lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center lg:justify-self-end">
          <AuthForm />
        </div>

        <ul className="flex max-w-xl flex-col gap-5 border-t border-line pt-8 lg:col-start-1 lg:row-start-2">
          {features.map((feature) => (
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
