import Image from 'next/image';
import Link from 'next/link';
import { getAdminDb } from '@/lib/firebase/admin';
import { formatTL } from '@/lib/utils/para';
import { karsilastirMasaAdi } from '@/lib/utils/masa';

export const dynamic = 'force-dynamic';

interface MasaKart {
  id: string;
  ad: string;
  acikAdisyonId: string | null;
  toplamKurus: number;
  siparisSayisi: number;
}

interface AdisyonDoc {
  masaId: string;
  toplamKurus: number;
  siparisSayisi: number;
}

interface MasaDoc {
  ad: string;
}

// 3 saniye timeout: emulator/firestore kapalıysa sayfa hang olmasın.
async function masalariYukle(): Promise<MasaKart[]> {
  const R = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!R) return [];

  const db = getAdminDb();
  const sorgu = Promise.all([
    db
      .collection(`restoranlar/${R}/masalar`)
      .where('aktifMi', '==', true)
      .get(),
    db
      .collection(`restoranlar/${R}/adisyonlar`)
      .where('durum', '==', 'acik')
      .get(),
  ]);

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('firestore-timeout')), 3000),
  );

  try {
    const [masaSnap, adisyonSnap] = await Promise.race([sorgu, timeout]);
    const acikMap = new Map<string, { id: string; data: AdisyonDoc }>();
    for (const d of adisyonSnap.docs) {
      const data = d.data() as AdisyonDoc;
      acikMap.set(data.masaId, { id: d.id, data });
    }
    return masaSnap.docs
      .map((m) => {
        const acik = acikMap.get(m.id);
        return {
          id: m.id,
          ad: (m.data() as MasaDoc).ad,
          acikAdisyonId: acik?.id ?? null,
          toplamKurus: acik?.data.toplamKurus ?? 0,
          siparisSayisi: acik?.data.siparisSayisi ?? 0,
        };
      })
      .sort((a, b) => karsilastirMasaAdi(a.ad, b.ad));
  } catch (e) {
    console.warn(
      '[questo] masalar yüklenemedi:',
      e instanceof Error ? e.message : e,
    );
    return [];
  }
}

export default async function HomePage() {
  const masalar = await masalariYukle();

  return (
    <main className="relative min-h-screen flex flex-col items-center p-6 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(80% 50% at 50% 25%, hsl(var(--accent) / 0.55) 0%, transparent 70%)',
        }}
      />
      <div className="relative max-w-4xl w-full space-y-8 text-center anim-fade-in">
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative size-20 overflow-hidden rounded-full"
            style={{ boxShadow: 'var(--shadow-floating)' }}
          >
            <Image
              src="/logo.jpg"
              alt="Questo Coffea Co."
              fill
              sizes="80px"
              priority
              className="object-cover"
            />
          </div>
          <div className="space-y-0.5">
            <p className="micro-caps text-muted-foreground">Sipariş paneli</p>
            <p className="font-serif text-sm text-muted-foreground">
              masadan sipariş al
            </p>
          </div>
        </div>

        {masalar.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {masalar.map((m) => {
              const acik = m.acikAdisyonId !== null;
              return (
                <li key={m.id}>
                  <Link
                    href={
                      acik
                        ? `/kasa/adisyonlar/${m.acikAdisyonId}`
                        : `/kasa/masa/${m.id}`
                    }
                    className={
                      'flex aspect-square flex-col justify-between rounded-xl border p-3 text-left shadow-soft transition active:scale-[0.97] ' +
                      (acik
                        ? 'border-primary/50 bg-primary/5 hover:bg-primary/10'
                        : 'bg-card hover:bg-accent/40')
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{m.ad}</span>
                      {acik && (
                        <span className="rounded-full border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary">
                          Açık
                        </span>
                      )}
                    </div>
                    {acik ? (
                      <div className="space-y-0.5">
                        <div className="text-xs text-muted-foreground">
                          {m.siparisSayisi} sipariş
                        </div>
                        <div className="text-lg font-semibold tabular-nums">
                          {formatTL(m.toplamKurus)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Boş</div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
            Henüz tanımlı masa yok.
          </p>
        )}

        <div className="text-sm">
          <Link
            href="/kasa"
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-5 py-2.5 shadow-soft transition active:scale-[0.98] hover:bg-accent/40"
          >
            Personel girişi
          </Link>
        </div>
      </div>
    </main>
  );
}
