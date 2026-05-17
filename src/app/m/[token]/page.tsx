import { MenuListesi } from '@/components/musteri/menu-listesi';
import { SepetCekmecesi } from '@/components/musteri/sepet-cekmecesi';
import { MasaBasligi } from './masa-basligi';

export default function MasaMenuSayfasi() {
  return (
    <main className="mx-auto max-w-md px-4 py-4">
      <MasaBasligi />
      <MenuListesi />
      <SepetCekmecesi />
    </main>
  );
}
