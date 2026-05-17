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
  console.error('[questo] beklenmedik hata:', e);
  return Response.json(
    { kod: 'sunucu_hata', mesaj: 'Beklenmedik bir hata oluştu.' },
    { status: 500 },
  );
};
