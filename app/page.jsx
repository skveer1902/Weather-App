'use client';
import { useEffect, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import WeatherCard from '@/components/WeatherCard';
import Forecast from '@/components/Forecast';


async function postJson(url, body) {
const r = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body) });
if (!r.ok) throw new Error(await r.text());
return r.json();
}


export default function Page() {
const [units, setUnits] = useState('imperial');
const [data, setData] = useState(null); // { name, lat, lon, units, current, forecast }
const [saved, setSaved] = useState([]);
const [saving, setSaving] = useState(false);


async function loadSaved() {
  try {
    const r = await fetch('/api/locations');
    if (!r.ok) {
      console.error('Failed to load locations', r.status);
      return;
    }
    const j = await r.json();
    setSaved(Array.isArray(j) ? j : []);
  } catch (err) {
    console.error('loadSaved error:', err);
  }
}


async function search(query) {
if (!query) return;
const j = await postJson('/api/weather', { query, units });
setData(j);
}


async function useGeo() {
if (!('geolocation' in navigator)) {
alert('Geolocation not supported');
return;
}
navigator.geolocation.getCurrentPosition(async (pos) => {
const { latitude: lat, longitude: lon } = pos.coords;
const j = await postJson('/api/weather', { lat, lon, units });
setData(j);
}, (err) => {
alert('Could not get location: ' + err.message);
});
}


async function saveLocation() {
if (!data) return;
try {
setSaving(true);
const res = await fetch('/api/locations', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ name: data.name, lat: data.lat, lon: data.lon })
});
if (!res.ok) throw new Error(await res.text());
await loadSaved();
} catch (e) {
alert('Save failed');
} finally {
setSaving(false);
}
}


async function deleteLocation(id) {
const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
if (res.ok) loadSaved();
}


async function renameLocation(id) {
const name = prompt('New name');
if (!name) return;
const res = await fetch(`/api/locations/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
if (res.ok) loadSaved();
}


return (
<div className="container">
<h1>Weather App</h1>
<p className="small">Search by city, zip/postal, or landmark • Or use your current location • Save favorites (CRUD)</p>


<SearchBar onSearch={search} onUseGeo={useGeo} units={units} onUnits={setUnits} />


{data && (
<>
<div className="row" style={{ marginTop:12 }}>
<button disabled={saving} className="btn" onClick={saveLocation}>☆ Save this location</button>
<span className="tag">{data.lat.toFixed(3)}, {data.lon.toFixed(3)}</span>
</div>
<div style={{ height:8 }} />
<WeatherCard data={data} />
<div style={{ height:8 }} />
<Forecast items={data.forecast} units={data.units} />
</>
)}


<div style={{ height:16 }} />
<div className="card">
<h3 style={{ marginTop:0 }}>Saved Locations</h3>
{!saved.length && <div className="small">No saved locations yet.</div>}
<ul className="list">
{saved.map(loc => (
<li key={loc.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0' }}>
<button className="btn" onClick={() => postJson('/api/weather', { lat: loc.lat, lon: loc.lon, units }).then(setData)}>Load</button>
<span style={{ flex:1 }}>{loc.name}</span>
<span className="tag">{loc.lat.toFixed(3)}, {loc.lon.toFixed(3)}</span>
<button className="btn" onClick={() => renameLocation(loc.id)}>Rename</button>
<button className="btn" onClick={() => deleteLocation(loc.id)}>Delete</button>
</li>
))}
</ul>
</div>
</div>
);
}