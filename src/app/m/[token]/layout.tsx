import { notFound } from 'next/navigation';
import { getAdminDb } from '@/lib/firebase/admin';
import { MasaSaglayici } from './masa-provider';

export const dynamic = 'force-dynamic';

const RESTORAN = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new Error('NEXT_PUBLIC_RESTORAN_ID tanımlı değil.');
  return id;
};

interface Props {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}

export default async function MusteriLayout({ children, params }: Props) {
  const { token } = await params;
  const R = RESTORAN();
  const db = getAdminDb();

  const restoranSnap = await db.doc(`restoranlar/${R}`).get();
  const restoranAd = restoranSnap.exists
    ? ((restoranSnap.data() as { ad?: string }).ad ?? 'Restoran')
    : 'Restoran';

  const masaSnap = await db
    .collection(`restoranlar/${R}/masalar`)
    .where('token', '==', token)
    .where('aktifMi', '==', true)
    .limit(1)
    .get();

  if (masaSnap.empty) notFound();
  const masa = masaSnap.docs[0]!;
  const masaAd = (masa.data() as { ad: string }).ad;

  return (
    <MasaSaglayici
      masa={{
        masaId: masa.id,
        masaAd,
        masaToken: token,
        restoranAd,
      }}
    >
      <div className="min-h-screen bg-background pb-24">{children}</div>
    </MasaSaglayici>
  );
}
