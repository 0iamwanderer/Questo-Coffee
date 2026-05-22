import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getAdminDb } from '@/lib/firebase/admin';
import { GarsonMenu } from '@/components/kasa/garson-menu';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const R = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new Error('NEXT_PUBLIC_RESTORAN_ID tanımlı değil.');
  return id;
};

// Henuz acik adisyonu olmayan masa icin yeni siparis baslangic sayfasi.
// Adisyon olusurolusmaz GarsonMenu icinde /kasa/adisyonlar/<id>'ye yonlendirir.
export default async function MasaSiparisSayfasi({
  params,
}: {
  params: Promise<{ masaId: string }>;
}) {
  const { masaId } = await params;
  const db = getAdminDb();
  const restoranId = R();

  const masaSnap = await db
    .doc(`restoranlar/${restoranId}/masalar/${masaId}`)
    .get();
  if (!masaSnap.exists) notFound();
  const masa = masaSnap.data() as { ad: string; token: string; aktifMi?: boolean };
  if (masa.aktifMi === false) notFound();

  // Bu masada zaten acik bir adisyon varsa o sayfaya yonlendir
  const acikSnap = await db
    .collection(`restoranlar/${restoranId}/adisyonlar`)
    .where('masaId', '==', masaId)
    .where('durum', '==', 'acik')
    .limit(1)
    .get();
  if (!acikSnap.empty) {
    redirect(`/kasa/adisyonlar/${acikSnap.docs[0]!.id}`);
  }

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      <Link
        href="/kasa/masalar"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Masalar
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{masa.ad}</h1>
        <p className="text-sm text-muted-foreground">İlk sipariş alınıyor</p>
      </div>

      <GarsonMenu masaToken={masa.token} masaAd={masa.ad} />
    </div>
  );
}
