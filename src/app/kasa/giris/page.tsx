import { Suspense } from 'react';
import { GirisForm } from './giris-form';

export const dynamic = 'force-dynamic';

export default function KasaGirisPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">Yükleniyor…</div>
        }
      >
        <GirisForm />
      </Suspense>
    </main>
  );
}
