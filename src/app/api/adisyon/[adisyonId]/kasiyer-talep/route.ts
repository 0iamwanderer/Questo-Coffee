// Bu dosya [id] klasörüne taşındı. Buraya ulaşılmamalı.
export async function POST() {
  return Response.json({ kod: 'tasinmis' }, { status: 410 });
}
