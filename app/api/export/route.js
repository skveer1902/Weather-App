// app/api/export/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '@/db';

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = v =>
    `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(','))
  ];
  return lines.join('\n');
}

function toMarkdown(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const headerLine = `| ${headers.join(' | ')} |`;
  const sepLine = `| ${headers.map(() => '---').join(' | ')} |`;
  const rowsLines = rows.map(r =>
    `| ${headers.map(h => String(r[h] ?? '')).join(' | ')} |`
  );
  return [headerLine, sepLine, ...rowsLines].join('\n');
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const format = (searchParams.get('format') || 'json').toLowerCase();

  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM weather_queries ORDER BY createdAt DESC'
  ).all();

  if (format === 'csv') {
    return new NextResponse(toCsv(rows), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="weather_queries.csv"'
      }
    });
  }

  if (format === 'md' || format === 'markdown') {
    return new NextResponse(toMarkdown(rows), {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8'
      }
    });
  }

  // default JSON
  return NextResponse.json(rows);
}
