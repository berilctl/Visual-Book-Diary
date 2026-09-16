"use client";

import type { Book } from "@/lib/books";
import { useI18n } from "@/components/i18n-provider";
import { CheckIcon, StarIcon } from "@/components/ui/icons";

// Kitaplık başlığı altındaki okuma istatistiği: bu yıl bitirilen kitaplar,
// onların ortalama puanı ve bitiş tarihi eksik tamamlanmış kitap uyarısı.
//
// "Bu yıl" kullanıcının YEREL takvimiyle hesaplanır (istemci bileşeni);
// sunucu UTC olduğu için yılbaşı gecesinin ilk saatlerinde önceki yılı
// gösterirdi. Sunucu ile tarayıcının yılı yalnızca o birkaç saatte farklı
// olabileceğinden yıla bağlı metinlerde hydration uyarısı bilerek susturulur.
export function ReadingStats({ books }: { books: Book[] }) {
  const { t, intlLocale } = useI18n();
  const year = new Date().getFullYear();

  const completed = books.filter((book) => book.status === "completed");
  const thisYear = completed.filter((book) =>
    book.finished_at?.startsWith(`${year}-`),
  );
  const ratings = thisYear
    .map((book) => book.rating)
    .filter((rating): rating is number => typeof rating === "number");
  const average =
    ratings.length > 0
      ? new Intl.NumberFormat(intlLocale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(ratings.reduce((sum, r) => sum + r, 0) / ratings.length)
      : null;
  // Bitiş tarihi olmayan tamamlanmış kitaplar sayılamaz; sessizce dışarıda
  // kalmasınlar, kullanıcı düzenleme formundan tarih ekleyebilir.
  const missingDates = completed.filter((book) => !book.finished_at).length;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 text-ink">
          <CheckIcon className="size-4 text-success" strokeWidth={2} />
          <span suppressHydrationWarning>
            {t.stats.finishedThisYear(thisYear.length)}
          </span>
        </span>

        {average && (
          <>
            <span aria-hidden className="text-line-strong">
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-ink-muted">
              <StarIcon filled className="size-4 text-gold" />
              <span aria-hidden suppressHydrationWarning>
                {t.stats.averageRating(average)}
              </span>
              <span className="sr-only" suppressHydrationWarning>
                {t.stats.averageRatingLabel(average)}
              </span>
            </span>
          </>
        )}
      </div>

      {missingDates > 0 && (
        <p className="mt-1 text-xs text-ink-subtle">
          {t.stats.missingDates(missingDates)}
        </p>
      )}
    </div>
  );
}
