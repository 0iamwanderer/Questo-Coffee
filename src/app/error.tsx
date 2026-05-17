'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[questo] global error:', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4 rounded-lg border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Bir şeyler ters gitti</h1>
          <p className="text-sm text-muted-foreground">
            {error.message || 'Beklenmedik bir hata oluştu.'}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/70">
              Referans: {error.digest}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          Tekrar dene
        </button>
      </div>
    </main>
  );
}
