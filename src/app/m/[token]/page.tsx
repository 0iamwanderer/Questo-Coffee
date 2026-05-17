import { MenuListesi } from '@/components/musteri/menu-listesi';
import { SepetCekmecesi } from '@/components/musteri/sepet-cekmecesi';
import { KvkkBildirim } from '@/components/musteri/kvkk-bildirim';
import { MasaBasligi } from './masa-basligi';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function MasaMenuSayfasi({ params }: Props) {
  const { token } = await params;
  return (
    <main className="mx-auto max-w-md px-4 py-4">
      <MasaBasligi />
      <MenuListesi />
      <SepetCekmecesi />
      <KvkkBildirim masaToken={token} />
    </main>
  );
}
