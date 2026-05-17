import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 text-center anim-fade-in">
        <div className="space-y-2">
          <p className="micro-caps text-muted-foreground">QR Sipariş</p>
          <h1 className="font-serif text-5xl">Questo</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Masadaki QR kodu okutarak siparişinizi vermek için bu sayfa
          yerine telefonunuzla menüye girin.
        </p>
        <div className="pt-2 text-sm">
          <Link
            href="/kasa/giris"
            className="inline-flex items-center rounded-full border bg-card px-4 py-2 shadow-soft transition active:scale-[0.98]"
          >
            Personel girişi
          </Link>
        </div>
      </div>
    </main>
  );
}
