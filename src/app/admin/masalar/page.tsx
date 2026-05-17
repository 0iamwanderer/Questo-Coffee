import { MasaYonetimi } from './masa-yonetimi';

export default function AdminMasalarSayfasi() {
  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Masalar</h1>
      <MasaYonetimi />
    </div>
  );
}
