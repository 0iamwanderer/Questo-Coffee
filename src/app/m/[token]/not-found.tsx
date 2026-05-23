export default function MasaNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-3 text-center">
        <h1 className="text-2xl font-semibold">Masa bulunamadı</h1>
        <p className="text-sm text-muted-foreground">
          Bağlantı geçersiz ya da masa pasif. Lütfen personeli çağırın.
        </p>
      </div>
    </main>
  );
}
