import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public readonly kod: string,
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const httpHata = (e: unknown): Response => {
  if (e instanceof AppError) {
    return Response.json(
      { kod: e.kod, mesaj: e.message },
      { status: e.status },
    );
  }
  if (e instanceof ZodError) {
    return Response.json(
      { kod: 'dogrulama_hatasi', mesaj: 'Geçersiz istek verisi.' },
      { status: 400 },
    );
  }
  const hata = e instanceof Error ? e : new Error(String(e));
  console.error('[questo] beklenmedik hata:', hata.message, hata);
  const mesaj =
    process.env.NODE_ENV === 'development'
      ? `Sunucu hatası: ${hata.message}`
      : 'Beklenmedik bir hata oluştu.';
  return Response.json(
    { kod: 'sunucu_hata', mesaj },
    { status: 500 },
  );
};
