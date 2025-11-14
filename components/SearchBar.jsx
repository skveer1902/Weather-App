'use client';
import { useState } from 'react';


export default function SearchBar({ onSearch, onUseGeo, units, onUnits }) {
const [q, setQ] = useState('');


return (
<div className="card" style={{ display:'flex', gap:8, alignItems:'center' }}>
<input
className="input"
placeholder="City, zip/postal, or landmark (e.g., Eiffel Tower)"
value={q}
onChange={e=>setQ(e.target.value)}
onKeyDown={e=> e.key==='Enter' && onSearch(q)}
/>
<button className="btn" onClick={()=>onSearch(q)}>Search</button>
<button className="btn" onClick={onUseGeo}>Use My Location</button>
<select className="input" style={{ maxWidth:140 }} value={units} onChange={e=>onUnits(e.target.value)}>
<option value="imperial">°F (US)</option>
<option value="metric">°C</option>
</select>
</div>
);
}