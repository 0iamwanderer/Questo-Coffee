import { describe, expect, it } from 'vitest';
import { AppError, httpHata } from '@/lib/utils/hata';

describe('httpHata', () => {
  it('AppError için kod ve status JSON döner', async () => {
    const res = httpHata(new AppError('stok_yok', 'Latte stokta yok', 409));
    expect(res.status).toBe(409);
    const j = await res.json();
    expect(j).toEqual({ kod: 'stok_yok', mesaj: 'Latte stokta yok' });
  });

  it('bilinmeyen hata için 500 ve sunucu_hata kodu döner', async () => {
    const res = httpHata(new Error('database is on fire'));
    expect(res.status).toBe(500);
    const j = await res.json();
    expect(j.kod).toBe('sunucu_hata');
    // Asıl mesajı sızdırmaz
    expect(j.mesaj).not.toContain('database');
  });
});
