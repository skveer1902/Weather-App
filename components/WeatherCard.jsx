export default function WeatherCard({ data }) {
if (!data) return null;
const { name, current, units } = data;
const temp = Math.round(current.main.temp);
const feels = Math.round(current.main.feels_like);
const icon = current.weather?.[0]?.icon;
const desc = current.weather?.[0]?.description;
const wind = current.wind?.speed;
const humidity = current.main?.humidity;


const unitSym = units === 'metric' ? '°C' : '°F';
const windUnit = units === 'metric' ? 'm/s' : 'mph';


return (
<div className="card">
<div style={{ display:'flex', alignItems:'center', gap:16 }}>
{icon && (
<img
alt={desc}
width={88}
height={88}
src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
/>
)}
<div>
<h2 style={{ margin:'4px 0' }}>{name}</h2>
<div className="small">{desc}</div>
<div style={{ fontSize:40, fontWeight:700 }}>{temp}{unitSym}</div>
<div className="small">Feels like {feels}{unitSym} • Wind {wind} {windUnit} • Humidity {humidity}%</div>
</div>
</div>
</div>
);
}