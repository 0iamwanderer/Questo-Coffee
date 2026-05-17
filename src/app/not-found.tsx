import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Sayfa bulunamadı</h1>
        <p className="text-muted-foreground text-sm">
          Aradığınız adres mevcut değil ya da kaldırılmış.
        </p>
        <Link href="/" className="text-sm underline">
          Ana sayfaya dön
        </Link>
      </div>
    </main>
  );
}
