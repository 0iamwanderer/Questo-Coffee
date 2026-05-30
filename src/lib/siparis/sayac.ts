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

/**
 * yyyy-mm-dd (Europe/Istanbul) için o günün başlangıç/bitiş UTC Date aralığı.
 * 00:00 Istanbul = bir önceki gün 21:00 UTC (TR'de DST yok, sabit +03:00).
 */
export const istanbulGunAraligi = (
  yyyymmdd: string,
): { baslangic: Date; bitis: Date } => {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  if (!y || !m || !d) throw new Error('Geçersiz tarih.');
  const baslangic = new Date(Date.UTC(y, m - 1, d, -3, 0, 0));
  const bitis = new Date(Date.UTC(y, m - 1, d, 21, 0, 0));
  return { baslangic, bitis };
};
