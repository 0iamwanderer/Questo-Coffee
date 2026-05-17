import { describe, expect, it } from 'vitest';
import { istanbulGunId } from '@/lib/siparis/sayac';

describe('istanbulGunId', () => {
  it('YYYY-MM-DD formatında üretir', () => {
    expect(istanbulGunId()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('UTC ile Istanbul farkı doğru hesaplanır (UTC 22:00 → ertesi gün)', () => {
    // 2026-05-17T22:00:00Z → Istanbul 2026-05-18 01:00
    const d = new Date('2026-05-17T22:00:00.000Z');
    expect(istanbulGunId(d)).toBe('2026-05-18');
  });

  it('Istanbul yerel günün başı UTC 21:00\'dir', () => {
    // 2026-05-17T20:59:59Z → Istanbul hala 17 Mayıs (23:59)
    const oncesi = new Date('2026-05-17T20:59:59.000Z');
    expect(istanbulGunId(oncesi)).toBe('2026-05-17');
    // 2026-05-17T21:00:00Z → Istanbul 18 Mayıs 00:00
    const sonrasi = new Date('2026-05-17T21:00:00.000Z');
    expect(istanbulGunId(sonrasi)).toBe('2026-05-18');
  });
});
