import { kasiyerGerekli } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

export default async function KasaAnaSayfa() {
  const u = await kasiyerGerekli('/kasa');

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">Kasa</h1>
        <p className="text-sm text-muted-foreground">
          Hoş geldin{u.email ? ` — ${u.email}` : ''}.{' '}
          {u.claims.sahip && (
            <span className="rounded-md border px-1.5 py-0.5 text-xs">
              sahip
            </span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          Kanban ve adisyon panelleri Faz 4&apos;te eklenecek.
        </p>
        <form action="/api/auth/cikis" method="post">
          <button
            type="submit"
            className="text-sm underline text-muted-foreground"
          >
            Çıkış yap
          </button>
        </form>
      </div>
    </main>
  );
}
