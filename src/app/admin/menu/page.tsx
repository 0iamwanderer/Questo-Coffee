import { MenuYonetimi } from './menu-yonetimi';

export default function AdminMenuSayfasi() {
  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Menü Yönetimi</h1>
      <MenuYonetimi />
    </div>
  );
}
