import type { DocumentReference, Firestore } from 'firebase-admin/firestore';

/**
 * Adisyonun şu ana kadar onaylanmış (durum=odendi) ödeme talepleri toplamı.
 * Sunucu tarafında çağrılır; race condition oluşmasın diye mümkünse
 * transaction içinde çağırılmamalı — kısıtlı sayıda doküman okuduğu için
 * dış read olarak kullanılır.
 */
export async function odenmisTutarKurus(
  adisyonRef: DocumentReference,
): Promise<number> {
  const snap = await adisyonRef
    .collection('odemeTalepleri')
    .where('durum', '==', 'odendi')
    .get();
  return snap.docs.reduce(
    (acc, d) =>
      acc + ((d.data() as { toplamKurus?: number }).toplamKurus ?? 0),
    0,
  );
}

/**
 * Eşit bölmede ödenecek tutarı hesaplar; bilinen kalan tutara göre sınırlar.
 * - kisi başına ceil(toplam/N) tahsil edilir, ama kalan tutardan fazla olamaz.
 * - Böylece son ödeme yapan kişi otomatik olarak küçük artığı kapatır.
 */
export function esitOdemeTutariHesapla(
  adisyonToplamKurus: number,
  kisiSayisi: number,
  kalanKurus: number,
): number {
  if (kisiSayisi < 1) return 0;
  if (kalanKurus <= 0) return 0;
  const kisiBasi = Math.ceil(adisyonToplamKurus / kisiSayisi);
  return Math.min(kisiBasi, kalanKurus);
}
