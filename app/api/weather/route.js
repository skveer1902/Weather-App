import { NextResponse } from 'next/server';


const BASE = 'https://api.openweathermap.org';
const API_KEY = process.env.OPENWEATHER_API_KEY;


async function fetchJson(url) {
const r = await fetch(url);
if (!r.ok) throw new Error(`Upstream error ${r.status}`);
return r.json();
}


function pickDailySummaries(list) {
// Group 3-hourly entries into days and pick around 12:00 for each day
const byDay = new Map();
for (const item of list) {
const date = new Date(item.dt * 1000);
const key = date.toISOString().slice(0, 10); // YYYY-MM-DD
const hour = date.getUTCHours();
const arr = byDay.get(key) || [];
arr.push({ hour, item });
byDay.set(key, arr);
}
const days = [];
for (const [key, arr] of byDay) {
// Choose entry closest to 12:00 UTC
arr.sort((a, b) => Math.abs(a.hour - 12) - Math.abs(b.hour - 12));
const chosen = arr[0].item;
days.push({ date: key, data: chosen });
}
// Return next 5 distinct days (including today)
days.sort((a, b) => a.date.localeCompare(b.date));
return days.slice(0, 5).map(d => d.data);
}


export async function POST(req) {
try {
const body = await req.json();
const units = body.units === 'metric' ? 'metric' : 'imperial';


let lat, lon, name;


if (typeof body.lat === 'number' && typeof body.lon === 'number') {
lat = body.lat; lon = body.lon; name = 'Your location';
} else if (typeof body.query === 'string' && body.query.trim()) {
const q = encodeURIComponent(body.query.trim());
const geo = await fetchJson(`${BASE}/geo/1.0/direct?q=${q}&limit=1&appid=${API_KEY}`);
if (!geo.length) return NextResponse.json({ error: 'Location not found' }, { status: 404 });
lat = geo[0].lat; lon = geo[0].lon; name = `${geo[0].name}${geo[0].state ? ', ' + geo[0].state : ''}${geo[0].country ? ', ' + geo[0].country : ''}`;
} else {
return NextResponse.json({ error: 'Provide { query } or { lat, lon }' }, { status: 400 });
}


const currentUrl = `${BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
const forecastUrl = `${BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;


const [current, forecastRaw] = await Promise.all([
fetchJson(currentUrl),
fetchJson(forecastUrl),
]);


const forecast = pickDailySummaries(forecastRaw.list);


return NextResponse.json({ name, lat, lon, units, current, forecast });
} catch (e) {
return NextResponse.json({ error: e.message }, { status: 500 });
}
}