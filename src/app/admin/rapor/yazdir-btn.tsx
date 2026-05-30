'use client';

import { Printer } from 'lucide-react';

/**
 * Raporu şık bir belge olarak kaydetmek için yazdırma diyaloğunu açar.
 * Tarayıcının "PDF olarak kaydet" hedefi seçilince gün sonu raporu A4
 * belge olarak diske kaydedilebilir. Baskı düzeni globals.css'teki
 * `@media print` kuralları ve `.rapor-belge` bölgesi ile biçimlenir.
 */
export function YazdirButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
    >
      <Printer className="size-4" />
      Belge olarak kaydet
    </button>
  );
}
