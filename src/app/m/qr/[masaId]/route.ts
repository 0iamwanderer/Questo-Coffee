import { redirect, notFound } from 'next/navigation';
import { getAdminDb } from '@/lib/firebase/admin';

const RESTORAN = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new Error('NEXT_PUBLIC_RESTORAN_ID tanımlı değil.');
  return id;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ masaId: string }> },
) {
  const { masaId } = await params;
  const db = getAdminDb();
  const snap = await db
    .doc(`restoranlar/${RESTORAN()}/masalar/${masaId}`)
    .get();

  if (!snap.exists) notFound();
  const data = snap.data() as { token: string; aktifMi: boolean };
  if (!data.aktifMi) notFound();

  redirect(`/m/${data.token}`);
}
