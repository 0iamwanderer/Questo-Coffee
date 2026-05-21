import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { apiSahip } from '@/lib/auth/guard';
import { getAdminDb } from '@/lib/firebase/admin';
import { httpHata } from '@/lib/utils/hata';
import { kapsamiDogrula, restoranIdGetir } from '@/lib/admin/restoran';

export const runtime = 'nodejs';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  ust: { alignItems: 'center', gap: 4 },
  restoran: { fontSize: 12, color: '#555' },
  masa: { fontSize: 32, fontWeight: 'bold' },
  qrSarmal: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qr: { width: 240, height: 240 },
  alt: { alignItems: 'center', gap: 2 },
  yardim: { fontSize: 10, color: '#444' },
  url: { fontSize: 8, color: '#888' },
});

interface MasaQr {
  id: string;
  ad: string;
  token: string;
  qrDataUrl: string;
}

export async function GET(req: Request) {
  try {
    const u = await apiSahip();
    kapsamiDogrula(u);

    const R = restoranIdGetir();
    const db = getAdminDb();

    const [restoranSnap, masaSnap] = await Promise.all([
      db.doc(`restoranlar/${R}`).get(),
      db
        .collection(`restoranlar/${R}/masalar`)
        .where('aktifMi', '==', true)
        .orderBy('ad', 'asc')
        .get(),
    ]);

    const restoranAd = restoranSnap.exists
      ? ((restoranSnap.data() as { ad?: string }).ad ?? 'Restoran')
      : 'Restoran';

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

    const masalar: MasaQr[] = await Promise.all(
      masaSnap.docs.map(async (d) => {
        const data = d.data() as { ad: string; token: string };
        const url = `${origin}/m/qr/${d.id}`;
        const qr = await QRCode.toDataURL(url, {
          width: 600,
          margin: 1,
          errorCorrectionLevel: 'M',
        });
        return {
          id: d.id,
          ad: data.ad,
          token: data.token,
          qrDataUrl: qr,
        };
      }),
    );

    const belge = (
      <Document>
        {masalar.map((m) => (
          <Page key={m.id} size="A6" style={styles.page}>
            <View style={styles.ust}>
              <Text style={styles.restoran}>{restoranAd}</Text>
              <Text style={styles.masa}>{m.ad}</Text>
            </View>
            <View style={styles.qrSarmal}>
              <PdfImage src={m.qrDataUrl} style={styles.qr} />
            </View>
            <View style={styles.alt}>
              <Text style={styles.yardim}>
                QR kodu telefonunuzla okutun ve sipariş verin
              </Text>
              <Text style={styles.url}>{`${origin}/m/qr/${m.id}`}</Text>
            </View>
          </Page>
        ))}
      </Document>
    );

    const buf = await renderToBuffer(belge);
    const ab = buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    ) as ArrayBuffer;

    return new Response(ab, {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="masalar-qr.pdf"',
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    return httpHata(e);
  }
}
