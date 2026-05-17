import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function KvkkSayfasi({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="mx-auto max-w-md px-4 py-4 space-y-4 text-sm">
      <Link
        href={`/m/${token}`}
        className="inline-flex items-center gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Menü
      </Link>

      <h1 className="text-xl font-semibold">
        Kişisel Verilerin İşlenmesi Aydınlatma Metni
      </h1>

      <section className="space-y-2">
        <h2 className="font-medium">Toplanan veriler</h2>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>
            Anonim cihaz kimliği (Firebase Auth tarafından oluşturulan UID) —
            ad/soyad/telefon gibi kişisel bilgi içermez.
          </li>
          <li>
            Sipariş içeriği, miktar ve isteğe bağlı not.
          </li>
          <li>
            Bağlantı ile ilgili teknik veri (IP adresi, tarayıcı, App Check
            doğrulama jetonu) — Google/Firebase altyapısı tarafından otomatik
            olarak işlenir.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">İşleme amacı</h2>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>Siparişinizi mutfak ve kasaya iletmek.</li>
          <li>Adisyonunuzu görüntüleyebilmenizi sağlamak.</li>
          <li>Kötü niyetli kullanım (bot, spam) tespit ve önleme.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Saklama süresi</h2>
        <p className="text-muted-foreground">
          Sipariş ve adisyon kayıtları yasal zorunluluk (vergi mevzuatı)
          kapsamında saklanır. Anonim cihaz kimliğiniz oturum sonunda
          pasifleşir.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Aktarım</h2>
        <p className="text-muted-foreground">
          Veriler Google LLC tarafından sağlanan Firebase altyapısında
          (Avrupa Birliği bölgesi) işlenir; üçüncü taraflarla paylaşılmaz.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Haklarınız</h2>
        <p className="text-muted-foreground">
          KVKK madde 11 kapsamındaki tüm haklarınızı (silme, düzeltme, bilgi
          talebi vb.) kullanmak için restoran yönetimine başvurabilirsiniz.
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        Bu metin demo amaçlıdır; gerçek kullanımda restoranın yetkili kişi
        bilgilerini ve VERBİS kaydını eklemeniz gerekir.
      </p>
    </main>
  );
}
