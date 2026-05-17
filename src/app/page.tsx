import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Questo</h1>
        <p className="text-muted-foreground">
          QR Kodlu Sipariş ve Adisyon Sistemi
        </p>
        <div className="flex flex-col gap-2 text-sm">
          <Link href="/kasa/giris" className="underline">
            Kasa girişi
          </Link>
        </div>
      </div>
    </main>
  );
}
