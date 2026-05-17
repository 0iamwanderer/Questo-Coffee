import { kasiyerGerekli } from '@/lib/auth/guard';
import { KasaShell } from './kasa-shell';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await kasiyerGerekli('/kasa');

  return (
    <KasaShell
      kullanici={{
        email: u.email ?? null,
        sahip: u.claims.sahip === true,
      }}
    >
      {children}
    </KasaShell>
  );
}
