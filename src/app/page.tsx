import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ClipboardList, UtensilsCrossed } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface RolKart {
  href: string;
  baslik: string;
  altyazi: string;
  aciklama: string;
  Ikon: typeof UtensilsCrossed;
}

const ROLLER: RolKart[] = [
  {
    href: '/kasa/masalar',
    baslik: 'Garson',
    altyazi: 'Masalar',
    aciklama: 'Masaya git, menüden ürün seç, adisyona ekle.',
    Ikon: UtensilsCrossed,
  },
  {
    href: '/kasa/adisyonlar',
    baslik: 'Kasiyer',
    altyazi: 'Adisyonlar',
    aciklama: 'Açık adisyonları gör, ödemeleri al, kapat.',
    Ikon: ClipboardList,
  },
];

export default function HomePage() {
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
      <div className="relative max-w-3xl w-full space-y-10 text-center anim-fade-in">
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
            <p className="micro-caps text-muted-foreground">Questo</p>
            <p className="font-serif text-base">Coffea Co.</p>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ROLLER.map((r) => (
            <li key={r.href}>
              <Link
                href={r.href}
                className="group flex h-full flex-col items-start gap-4 rounded-2xl border bg-card p-6 text-left shadow-soft transition active:scale-[0.98] hover:bg-accent/40"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <r.Ikon className="size-6" />
                </span>
                <div className="space-y-1">
                  <p className="micro-caps text-muted-foreground">
                    {r.altyazi}
                  </p>
                  <h2 className="font-serif text-2xl leading-none">
                    {r.baslik}
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {r.aciklama}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Aç
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
