// app/api/queries/[id]/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '@/db';

const BASE = 'https://api.openweathermap.org';
const API_KEY = process.env.OPENWEATHER_API_KEY;

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Upstream error ${r.status}`);
  return r.json();
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

function filterForecastByRange(list, startDate, endDate) {
  const startMs = startDate.setHours(0, 0, 0, 0);
  const endMs = endDate.setHours(23, 59, 59, 999);
  return list.filter(item => {
    const t = item.dt * 1000;
    return t >= startMs && t <= endMs;
  });
}

export async function GET(req, { params }) {
  const id = Number(params.id);
  const db = getDb();
  const row = db.prepare(
    'SELECT * FROM weather_queries WHERE id = ?'
  ).get(id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const { startDate, endDate, units } = body;

    const s = parseDate(startDate);
    const e = parseDate(endDate);
    if (!s || !e || s > e) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      );
    }

    const db = getDb();
    const original = db.prepare(
      'SELECT * FROM weather_queries WHERE id = ?'
    ).get(id);
    if (!original) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const unitsFinal = units === 'metric' || units === 'imperial'
      ? units
      : original.units;

    // Re-fetch forecast to keep data coherent
    const forecastUrl =
      `${BASE}/data/2.5/forecast?lat=${original.lat}&lon=${original.lon}&units=${unitsFinal}&appid=${API_KEY}`;
    const forecastRaw = await fetchJson(forecastUrl);
    const filtered = filterForecastByRange(forecastRaw.list, new Date(startDate), new Date(endDate));

    const payloadObj = {
      locationName: original.locationName,
      lat: original.lat,
      lon: original.lon,
      units: unitsFinal,
      startDate,
      endDate,
      items: filtered
    };

    const info = db.prepare(`
      UPDATE weather_queries
      SET startDate = ?, endDate = ?, units = ?, payload = ?
      WHERE id = ?
    `).run(startDate, endDate, unitsFinal, JSON.stringify(payloadObj), id);

    if (!info.changes) {
      return NextResponse.json({ error: 'Nothing updated' }, { status: 400 });
    }

    const row = db.prepare(
      'SELECT * FROM weather_queries WHERE id = ?'
    ).get(id);
    return NextResponse.json(row);
  } catch (e) {
    console.error('PUT /api/queries error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const id = Number(params.id);
    const db = getDb();
    const info = db.prepare(
      'DELETE FROM weather_queries WHERE id = ?'
    ).run(id);
    if (!info.changes) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/queries error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
