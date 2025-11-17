export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '@/db';

export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const { name } = await req.json();
    if (!id || !name) {
      return NextResponse.json(
        { error: 'id and name required' },
        { status: 400 },
      );
    }
    const db = getDb();
    const info = db
      .prepare('UPDATE locations SET name = ? WHERE id = ?')
      .run(name, id);
    if (!info.changes) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const row = db
      .prepare('SELECT * FROM locations WHERE id = ?')
      .get(id);
    return NextResponse.json(row);
  } catch (e) {
    console.error('PUT /api/locations error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const id = Number(params.id);
    const db = getDb();
    const info = db
      .prepare('DELETE FROM locations WHERE id = ?')
      .run(id);
    if (!info.changes) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/locations error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
