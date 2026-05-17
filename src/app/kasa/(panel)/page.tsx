import { KanbanPanosu } from '@/components/kasa/kanban-panosu';

export default function KasaAnaSayfa() {
  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Sipariş Panosu</h1>
      <KanbanPanosu />
    </div>
  );
}
