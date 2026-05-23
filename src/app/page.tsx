import Image from 'next/image';
import { RolKartlari } from './rol-kartlari';

export const dynamic = 'force-dynamic';

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

        <RolKartlari />
      </div>
    </main>
  );
}
