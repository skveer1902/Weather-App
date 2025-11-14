// app/api/locations/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM locations ORDER BY createdAt DESC').all();
  return NextResponse.json(rows);
}

export async function POST(req) {
  try {
    const { name, lat, lon } = await req.json();
    if (!name || typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json({ error: 'name, lat, lon required' }, { status: 400 });
    }
    const db = getDb();
    const stmt = db.prepare('INSERT INTO locations (name, lat, lon) VALUES (?, ?, ?)');
    const info = stmt.run(name, lat, lon);
    const row = db.prepare('SELECT * FROM locations WHERE id = ?').get(info.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('POST /api/locations error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
