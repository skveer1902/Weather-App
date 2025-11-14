export default function Forecast({ items, units }) {
if (!items?.length) return null;
const unitSym = units === 'metric' ? '°C' : '°F';


return (
<div className="card">
<h3 style={{ marginTop:0 }}>5‑Day Forecast</h3>
<div className="grid">
{items.map((d, idx) => {
const date = new Date(d.dt * 1000);
const label = date.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });
const icon = d.weather?.[0]?.icon;
const desc = d.weather?.[0]?.description;
const t = Math.round(d.main.temp);
return (
<div key={idx} className="card" style={{ background:'#0e1729' }}>
<div className="small">{label}</div>
{icon && <img alt={desc} width={64} height={64} src={`https://openweathermap.org/img/wn/${icon}@2x.png`} />}
<div style={{ fontSize:22, fontWeight:700 }}>{t}{unitSym}</div>
<div className="small">{desc}</div>
</div>
);
})}
</div>
</div>
);
}