import { describe, expect, it } from 'vitest';
import { uretMasaToken } from '@/lib/utils/token';

describe('uretMasaToken', () => {
  it('22 karakter URL-safe alfasayısal token üretir', () => {
    const token = uretMasaToken();
    expect(token).toHaveLength(22);
    expect(token).toMatch(/^[0-9A-Za-z]+$/);
  });

  it('1000 token üretildiğinde çakışma olmaz (yüksek entropi)', () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) set.add(uretMasaToken());
    expect(set.size).toBe(1000);
  });
});
