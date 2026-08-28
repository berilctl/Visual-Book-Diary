import { AuthForm } from "@/components/auth-form";

// Landing + Login/Register (PRD Bölüm 7).
// Giriş yapmış kullanıcı buraya gelirse proxy onu /dashboard'a yönlendirir.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      <header className="max-w-md text-center">
        <h1 className="text-4xl text-ink">
          Visual Book Diary
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Okuduğun kitaplardaki karakterleri, mekanları ve alıntıları görsel bir
          günlükte topla.
        </p>
      </header>

      <AuthForm />
    </main>
  );
}
