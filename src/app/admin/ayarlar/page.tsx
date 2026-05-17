import { getAdminDb } from '@/lib/firebase/admin';
import { AyarForm } from './ayar-form';

export const dynamic = 'force-dynamic';

const R = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new Error('NEXT_PUBLIC_RESTORAN_ID tanımlı değil.');
  return id;
};

export default async function AyarlarSayfasi() {
  const snap = await getAdminDb().doc(`restoranlar/${R()}`).get();
  const ad = snap.exists ? ((snap.data() as { ad?: string }).ad ?? '') : '';

  return (
    <div className="mx-auto max-w-xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Restoran Ayarları</h1>
      <AyarForm baslangic={{ ad }} />
    </div>
  );
}
