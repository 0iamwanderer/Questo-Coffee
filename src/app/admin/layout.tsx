import { sahipGerekli } from '@/lib/auth/guard';
import { AdminShell } from './admin-shell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await sahipGerekli('/admin/menu');
  return <AdminShell email={u.email ?? null}>{children}</AdminShell>;
}
