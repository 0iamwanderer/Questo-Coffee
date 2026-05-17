import { describe, expect, it } from 'vitest';
import { formatTL, tlToKurus } from '@/lib/utils/para';
import { Kurus } from '@/types/model';

describe('para', () => {
  it('formatTL kuruşu Türk lirasına TR formatıyla çevirir', () => {
    expect(formatTL(Kurus(12500))).toMatch(/125,00/);
    expect(formatTL(Kurus(0))).toMatch(/0,00/);
    expect(formatTL(Kurus(50))).toMatch(/0,50/);
  });

  it('tlToKurus kayan noktayı doğru yuvarlar', () => {
    expect(tlToKurus(1)).toBe(100);
    expect(tlToKurus(1.5)).toBe(150);
    expect(tlToKurus(99.99)).toBe(9999);
    expect(tlToKurus(0.1 + 0.2)).toBe(30); // float artıkları yutar
  });

  it('Kurus brand kabuğu negatif veya küsuratlı değeri reddeder', () => {
    expect(() => Kurus(-1)).toThrow();
    expect(() => Kurus(1.5)).toThrow();
    expect(() => Kurus(NaN)).toThrow();
  });
});
