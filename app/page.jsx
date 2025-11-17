// app/page.jsx
'use client';

import { useEffect, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import WeatherCard from '@/components/WeatherCard';
import Forecast from '@/components/Forecast';

async function postJson(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function Page() {
  const [units, setUnits] = useState('imperial');
  const [data, setData] = useState(null); // { name, lat, lon, units, current, forecast }

  // Saved locations (basic CRUD from earlier)
  const [saved, setSaved] = useState([]);
  const [saving, setSaving] = useState(false);

  // Advanced CRUD: weather_queries
  const [queries, setQueries] = useState([]);
  const [qLocation, setQLocation] = useState('');
  const [qStart, setQStart] = useState('');
  const [qEnd, setQEnd] = useState('');
  const [creating, setCreating] = useState(false);

  // PM Accelerator info panel
  const [showInfo, setShowInfo] = useState(false);

  // --- Basic saved locations helpers ---

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

  async function saveLocation() {
    if (!data) return;
    try {
      setSaving(true);
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, lat: data.lat, lon: data.lon }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadSaved();
    } catch (e) {
      console.error('Save failed', e);
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
    const res = await fetch(`/api/locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) loadSaved();
  }

  // --- Advanced CRUD: weather_queries helpers ---

  async function loadQueries() {
    try {
      const r = await fetch('/api/queries');
      if (!r.ok) {
        console.error('Failed to load queries', r.status);
        return;
      }
      const j = await r.json();
      setQueries(Array.isArray(j) ? j : []);
    } catch (err) {
      console.error('loadQueries error:', err);
    }
  }

  async function createQuery() {
    if (!qLocation || !qStart || !qEnd) {
      alert('Please fill location and both dates');
      return;
    }
    try {
      setCreating(true);
      const r = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: qLocation,
          startDate: qStart,
          endDate: qEnd,
          units,
        }),
      });
      const bodyText = await r.text();
      if (!r.ok) {
        console.error('createQuery error', bodyText);
        try {
          const err = JSON.parse(bodyText);
          alert(err.error || 'Create failed');
        } catch {
          alert('Create failed');
        }
        return;
      }
      await loadQueries();
    } catch (e) {
      console.error(e);
      alert('Create failed');
    } finally {
      setCreating(false);
    }
  }

  async function updateQuery(id) {
    const startDate = prompt('New start date (YYYY-MM-DD)');
    const endDate = prompt('New end date (YYYY-MM-DD)');
    if (!startDate || !endDate) return;

    const r = await fetch(`/api/queries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, units }),
    });

    const txt = await r.text();
    if (!r.ok) {
      try {
        const err = JSON.parse(txt);
        alert(err.error || 'Update failed');
      } catch {
        alert('Update failed');
      }
      return;
    }

    await loadQueries();
  }

  async function deleteQuery(id) {
    if (!confirm('Delete this record?')) return;
    const r = await fetch(`/api/queries/${id}`, { method: 'DELETE' });
    if (r.ok) await loadQueries();
  }

  async function viewQuery(id) {
    const r = await fetch(`/api/queries/${id}`);
    if (!r.ok) {
      alert('Could not load record');
      return;
    }
    const j = await r.json();
    try {
      const payload = JSON.parse(j.payload);
      console.log('Weather payload', payload);
      alert(
        `Location: ${payload.locationName}\nRange: ${payload.startDate} → ${payload.endDate}\nItems: ${payload.items?.length ?? 0}`,
      );
    } catch {
      alert('Cannot parse payload');
    }
  }

  // --- Weather search & geolocation ---

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
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const j = await postJson('/api/weather', { lat, lon, units });
        setData(j);
      },
      (err) => {
        alert('Could not get location: ' + err.message);
      },
    );
  }

  // --- Initial load ---

  useEffect(() => {
    loadSaved();
    loadQueries();
  }, []);

  return (
    <div className="container">
      <h1>Weather App – Subhash Krishna Veer Buddhi</h1>

      <button className="btn" onClick={() => setShowInfo((s) => !s)}>
        {showInfo ? 'Hide PMA Info' : 'Show PM Accelerator Info'}
      </button>

      {showInfo && (
        <div
          className="card"
          style={{ marginTop: 12, maxHeight: 260, overflowY: 'auto' }}
        >
          <h3>Product Manager Accelerator (PMA) – Overview</h3>
          <p>
            The Product Manager Accelerator Program is designed to support PM professionals
            through every stage of their careers, from students looking for entry-level jobs
            to directors and executives. Our community is ambitious and committed, and
            members use the program to learn, practice, and sharpen product management and
            leadership skills.
          </p>
          <p>Examples of services we offer include:</p>
          <ul className="small">
            <li>
              <strong>PMA Pro</strong> – End-to-end job hunting program with FAANG-level PM
              training, unlimited mock interviews, and alumni referrals.
            </li>
            <li>
              <strong>AI PM Bootcamp</strong> – Hands-on AI product management by building and
              launching a real AI product with a cross-functional team.
            </li>
            <li>
              <strong>PMA Power Skills</strong> – Improve core PM skills, leadership, and
              executive presentation skills.
            </li>
            <li>
              <strong>PMA Leader</strong> – Coaching to move into director and executive-level
              product roles.
            </li>
            <li>
              <strong>1:1 Resume Review</strong> – Rewrite your PM resume with an interview
              guarantee (free templates used by thousands of PMs).
            </li>
          </ul>
          <p className="small">
            Website: https://www.pmaccelerator.io/ | Phone: +1 954 889 1063 | YouTube:
            https://www.youtube.com/c/drnancyli | Instagram: @drnancyli
          </p>
        </div>
      )}

      <p className="small" style={{ marginTop: 12 }}>
        Search by city, zip/postal, or landmark • Or use your current location • Save favorite
        locations • Store and manage historical weather queries with full CRUD and export.
      </p>

      <SearchBar
        onSearch={search}
        onUseGeo={useGeo}
        units={units}
        onUnits={setUnits}
      />

      {data && (
        <>
          <div className="row" style={{ marginTop: 12 }}>
            <button disabled={saving} className="btn" onClick={saveLocation}>
              ☆ Save this location
            </button>
            <span className="tag">
              {data.lat.toFixed(3)}, {data.lon.toFixed(3)}
            </span>
          </div>
          <div style={{ height: 8 }} />
          <WeatherCard data={data} />
          <div style={{ height: 8 }} />
          <Forecast items={data.forecast} units={data.units} />
        </>
      )}

      {/* Saved locations section */}
      <div style={{ height: 16 }} />
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Saved Locations</h3>
        {!saved.length && <div className="small">No saved locations yet.</div>}
        <ul className="list">
          {saved.map((loc) => (
            <li
              key={loc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                flexWrap: 'wrap',
              }}
            >
              <button
                className="btn"
                onClick={() =>
                  postJson('/api/weather', { lat: loc.lat, lon: loc.lon, units }).then(
                    setData,
                  )
                }
              >
                Load
              </button>
              <span style={{ flex: 1 }}>{loc.name}</span>
              <span className="tag">
                {loc.lat.toFixed(3)}, {loc.lon.toFixed(3)}
              </span>
              <button className="btn" onClick={() => renameLocation(loc.id)}>
                Rename
              </button>
              <button className="btn" onClick={() => deleteLocation(loc.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Advanced CRUD section */}
      <div style={{ height: 16 }} />

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Advanced Weather History (CRUD)</h3>
        <p className="small">
          This section demonstrates persistence with CRUD functionality over weather queries.
          Users enter a location and date range; the app validates the input, calls the
          OpenWeather API to validate the location and retrieve forecast data, and then stores
          the full payload in SQLite.
        </p>

        <div className="row" style={{ marginBottom: 12 }}>
          <input
            className="input"
            placeholder="Location (city, zip, landmark, etc.)"
            value={qLocation}
            onChange={(e) => setQLocation(e.target.value)}
          />
          <input
            type="date"
            className="input"
            value={qStart}
            onChange={(e) => setQStart(e.target.value)}
          />
          <input
            type="date"
            className="input"
            value={qEnd}
            onChange={(e) => setQEnd(e.target.value)}
          />
          <button className="btn" disabled={creating} onClick={createQuery}>
            {creating ? 'Saving…' : 'Create & Store'}
          </button>
        </div>

        <p className="small">
          Note: Date ranges are validated and limited (e.g., to 7 days). Locations are validated
          using OpenWeather geocoding, which supports city names, zip/postal codes, and common
          landmarks.
        </p>

        <h4>Stored Weather Queries</h4>
        {!queries.length && <div className="small">No records yet.</div>}

        <ul className="list">
          {queries.map((q) => (
            <li
              key={q.id}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                padding: '6px 0',
                alignItems: 'center',
              }}
            >
              <span style={{ flex: 1 }}>
                {q.locationName} ({q.startDate} → {q.endDate}) [{q.units}]
              </span>
              <button className="btn" onClick={() => viewQuery(q.id)}>
                View
              </button>
              <button className="btn" onClick={() => updateQuery(q.id)}>
                Update
              </button>
              <button className="btn" onClick={() => deleteQuery(q.id)}>
                Delete
              </button>
              {/* Simple external integrations (no extra keys needed) */}
              <a
                className="small"
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                  q.locationName + ' weather travel guide',
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                YouTube
              </a>
              <a
                className="small"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  q.locationName,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Maps
              </a>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 8 }}>
          <a
            className="btn"
            href="/api/export?format=json"
            target="_blank"
            rel="noreferrer"
          >
            Export JSON
          </a>{' '}
          <a
            className="btn"
            href="/api/export?format=csv"
            target="_blank"
            rel="noreferrer"
          >
            Export CSV
          </a>{' '}
          <a
            className="btn"
            href="/api/export?format=md"
            target="_blank"
            rel="noreferrer"
          >
            Export Markdown
          </a>
        </div>
      </div>
    </div>
  );
}
