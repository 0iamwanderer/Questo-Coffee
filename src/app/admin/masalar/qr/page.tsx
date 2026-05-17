import Link from 'next/link';
import { Download } from 'lucide-react';
import { getAdminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const R = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new Error('NEXT_PUBLIC_RESTORAN_ID tanımlı değil.');
  return id;
};

export default async function QrPdfSayfasi() {
  const db = getAdminDb();
  const masaSnap = await db
    .collection(`restoranlar/${R()}/masalar`)
    .where('aktifMi', '==', true)
    .get();
  const sayisi = masaSnap.size;

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Masa QR PDF</h1>
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Aktif masalar için her sayfada bir QR olan A6 PDF üretir. Yazdırıp
          masalara yerleştirin.
        </p>
        <p className="text-sm">
          <span className="font-medium">{sayisi}</span> aktif masa için PDF
          hazırlanacak.
        </p>
        <Link
          href="/api/admin/masa/qr/pdf"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          <Download className="size-4" />
          PDF indir
        </Link>
      </div>
    </div>
  );
}
