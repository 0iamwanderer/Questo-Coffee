import Link from 'next/link';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { getAdminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

interface MasaListeItem {
  id: string;
  ad: string;
  token: string;
}

// Emulator/dev modunda masaları listele — dev kolaylığı.
// Production'da bu kart render edilmez.
// 3 saniye timeout: emulator kapalıysa sayfa hang olmasın.
async function masalariYukle(): Promise<MasaListeItem[]> {
  const devMode =
    !!process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.NEXT_PUBLIC_USE_EMULATOR === '1';
  if (!devMode) return [];

  const R = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!R) return [];

  const sorgu = getAdminDb()
    .collection(`restoranlar/${R}/masalar`)
    .where('aktifMi', '==', true)
    .orderBy('ad', 'asc')
    .get();

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('emulator-timeout')), 3000),
  );

  try {
    const snap = await Promise.race([sorgu, timeout]);
    return snap.docs.map((d) => {
      const data = d.data() as { ad: string; token: string };
      return { id: d.id, ad: data.ad, token: data.token };
    });
  } catch (e) {
    console.warn(
      '[questo] masalar yüklenemedi (emulator çalışıyor mu?):',
      e instanceof Error ? e.message : e,
    );
    return [];
  }
}

export default async function HomePage() {
  const masalar = await masalariYukle();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center anim-fade-in">
        <div className="space-y-2">
          <p className="micro-caps text-muted-foreground">QR Sipariş</p>
          <h1 className="font-serif text-5xl">Questo</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Masadaki QR kodu okutarak siparişinizi vermek için bu sayfa
          yerine telefonunuzla menüye girin.
        </p>

        <div className="text-sm">
          <Link
            href="/kasa/giris"
            className="inline-flex items-center rounded-full border bg-card px-4 py-2 shadow-soft transition active:scale-[0.98]"
          >
            Personel girişi
          </Link>
        </div>

        {masalar.length > 0 && (
          <div className="space-y-3 rounded-2xl border border-dashed border-amber-500/40 bg-amber-50/50 p-4 text-left dark:bg-amber-950/20">
            <div className="flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-200">
              <FlaskConical className="size-4" />
              <span className="micro-caps">Dev kısayolu</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Emulator modunda masaları doğrudan açabilirsin. Bu kart
              production'da gizli kalır — gerçek müşteri QR kodu okutarak gelir.
            </p>
            <ul className="space-y-1.5">
              {masalar.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/m/${m.token}`}
                    className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-soft transition active:scale-[0.98] hover:bg-accent/40"
                  >
                    <span className="font-medium">{m.ad}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      Aç
                      <ArrowRight className="size-3.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
