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
  return list.filter((item) => {
    const t = item.dt * 1000;
    return t >= startMs && t <= endMs;
  });
}

export async function GET() {
  try {
    const db = getDb();
    const rows = db
      .prepare('SELECT * FROM weather_queries ORDER BY createdAt DESC')
      .all();
    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET /api/queries error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { query, startDate, endDate } = body;
    const units = body.units === 'metric' ? 'metric' : 'imperial';

    const s = parseDate(startDate);
    const e = parseDate(endDate);
    if (!s || !e) {
      return NextResponse.json(
        { error: 'Invalid startDate or endDate; expected YYYY-MM-DD' },
        { status: 400 },
      );
    }
    if (s > e) {
      return NextResponse.json(
        { error: 'startDate must be before or equal to endDate' },
        { status: 400 },
      );
    }

    const diffDays = (e - s) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      return NextResponse.json(
        { error: 'Date range too large; please use 7 days or less' },
        { status: 400 },
      );
    }

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'query (location) is required' },
        { status: 400 },
      );
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Missing OPENWEATHER_API_KEY' },
        { status: 500 },
      );
    }

    const q = encodeURIComponent(query.trim());
    const geo = await fetchJson(
      `${BASE}/geo/1.0/direct?q=${q}&limit=1&appid=${API_KEY}`,
    );
    if (!geo.length) {
      return NextResponse.json(
        { error: 'Location not found (no geocoding result)' },
        { status: 404 },
      );
    }

    const g = geo[0];
    const lat = g.lat;
    const lon = g.lon;
    const locationName = `${g.name}${g.state ? ', ' + g.state : ''}${
      g.country ? ', ' + g.country : ''
    }`;

    const forecastUrl = `${BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
    const forecastRaw = await fetchJson(forecastUrl);
    const filtered = filterForecastByRange(
      forecastRaw.list,
      new Date(startDate),
      new Date(endDate),
    );

    const payloadObj = {
      locationName,
      lat,
      lon,
      units,
      startDate,
      endDate,
      items: filtered,
    };

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO weather_queries (locationName, lat, lon, startDate, endDate, units, payload)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      locationName,
      lat,
      lon,
      startDate,
      endDate,
      units,
      JSON.stringify(payloadObj),
    );

    const row = db
      .prepare('SELECT * FROM weather_queries WHERE id = ?')
      .get(info.lastInsertRowid);

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('POST /api/queries error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
