import Image from 'next/image';
import Link from 'next/link';
import { FlaskConical } from 'lucide-react';
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
    <main className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(80% 50% at 50% 25%, hsl(var(--accent) / 0.55) 0%, transparent 70%)',
        }}
      />
      <div className="relative max-w-2xl w-full space-y-8 text-center anim-fade-in">
        <div className="flex flex-col items-center gap-4">
          <div
            className="relative size-32 overflow-hidden rounded-full"
            style={{ boxShadow: 'var(--shadow-floating)' }}
          >
            <Image
              src="/logo.jpg"
              alt="Questo Coffea Co."
              fill
              sizes="128px"
              priority
              className="object-cover"
            />
          </div>
          <div className="space-y-1">
            <p className="micro-caps text-muted-foreground">QR Sipariş</p>
            <p className="font-serif text-sm text-muted-foreground">
              kahve &amp; mola
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Masadaki QR kodu okutarak siparişinizi vermek için bu sayfa
          yerine telefonunuzla menüye girin.
        </p>

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
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {masalar.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/m/${m.token}`}
                    className="flex aspect-square items-center justify-center rounded-xl border bg-card text-sm font-medium shadow-soft transition active:scale-[0.97] hover:bg-accent/40"
                  >
                    {m.ad}
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
