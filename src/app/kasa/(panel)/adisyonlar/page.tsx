import Link from 'next/link';
import { getAdminDb } from '@/lib/firebase/admin';
import { formatTL } from '@/lib/utils/para';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const R = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new Error('NEXT_PUBLIC_RESTORAN_ID tanımlı değil.');
  return id;
};

interface AdisyonDoc {
  masaId: string;
  toplamKurus: number;
  siparisSayisi: number;
}

interface MasaDoc {
  ad: string;
}

export default async function AdisyonlarSayfasi() {
  const db = getAdminDb();
  const restoranId = R();

  const [adisyonSnap, masaSnap] = await Promise.all([
    db
      .collection(`restoranlar/${restoranId}/adisyonlar`)
      .where('durum', '==', 'acik')
      .get(),
    db.collection(`restoranlar/${restoranId}/masalar`).get(),
  ]);

  const masaAdi = new Map<string, string>(
    masaSnap.docs.map((d) => [d.id, (d.data() as MasaDoc).ad]),
  );

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Açık Adisyonlar</h1>
      {adisyonSnap.empty ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Şu an açık adisyon yok.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {adisyonSnap.docs.map((d) => {
            const a = d.data() as AdisyonDoc;
            return (
              <li key={d.id}>
                <Link
                  href={`/kasa/adisyonlar/${d.id}`}
                  className="block rounded-lg border bg-card p-4 transition hover:bg-accent"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {masaAdi.get(a.masaId) ?? 'Bilinmeyen masa'}
                    </span>
                    <span className="rounded-md border px-2 py-0.5 text-xs">
                      {a.siparisSayisi} sipariş
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Toplam
                  </div>
                  <div className="text-xl font-semibold">
                    {formatTL(a.toplamKurus)}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
