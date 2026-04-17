/**
 * Arabic relative-time formatting for listing cards + detail pages.
 *
 * We deliberately avoid a full i18n dependency for a single helper.
 * Output matches the tone the souq uses elsewhere ("قبل ساعتين",
 * "قبل 3 أيام") rather than Intl.RelativeTimeFormat's "منذ 3 أيام"
 * which feels clinical next to the rest of the RTL copy.
 */

type Input = string | number | Date | null | undefined;

export function formatRelativeArabic(input: Input): string {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";

  const diffMs = Date.now() - d.getTime();
  // Future timestamps (clock drift, just-published) → treat as "الآن"
  if (diffMs < 30_000) return "الآن";

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) return "قبل لحظات";
  if (minutes === 1) return "قبل دقيقة";
  if (minutes === 2) return "قبل دقيقتين";
  if (minutes < 11) return `قبل ${minutes} دقائق`;
  if (minutes < 60) return `قبل ${minutes} دقيقة`;

  if (hours === 1) return "قبل ساعة";
  if (hours === 2) return "قبل ساعتين";
  if (hours < 11) return `قبل ${hours} ساعات`;
  if (hours < 24) return `قبل ${hours} ساعة`;

  if (days === 1) return "قبل يوم";
  if (days === 2) return "قبل يومين";
  if (days < 11) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${days} يوماً`;

  if (months === 1) return "قبل شهر";
  if (months === 2) return "قبل شهرين";
  if (months < 11) return `قبل ${months} أشهر`;
  if (months < 12) return `قبل ${months} شهراً`;

  if (years === 1) return "قبل سنة";
  if (years === 2) return "قبل سنتين";
  return `قبل ${years} سنوات`;
}
