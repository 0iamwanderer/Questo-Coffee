// Masa adlarinin "M1 < M10 < M2" gibi alfabetik siralanmasini engelleyen
// dogal karsilastirici. "Masa 2" < "Masa 10" gibi sayisal siraya getirir.
export function karsilastirMasaAdi(a: string, b: string): number {
  const sa = parseInt(a.match(/\d+/)?.[0] ?? '0', 10);
  const sb = parseInt(b.match(/\d+/)?.[0] ?? '0', 10);
  if (sa !== sb) return sa - sb;
  return a.localeCompare(b, 'tr');
}
