/**
 * Europe/Istanbul saat dilimine göre YYYY-MM-DD.
 * Günlük sipariş sayacının doc id'si bu fonksiyondan üretilir.
 * Pure fonksiyon — server ve istemciden çağrılabilir.
 */
export const istanbulGunId = (d: Date = new Date()): string => {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA → "2026-05-17"
  return fmt.format(d);
};
