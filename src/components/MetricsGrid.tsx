import React from 'react';
import { WeatherData, AirQualityData } from '../types';
import { fmtTemp, fmtWind, fmtVis, fmtPres, fmtPrec, calcDewPoint, degToCompass } from '../utils/weather';
import {
  Droplets,
  Wind,
  Gauge,
  Eye,
  SunMedium,
  Activity,
  Thermometer,
  CloudRain
} from 'lucide-react';

interface MetricsGridProps {
  weather: WeatherData;
  air: AirQualityData | null;
  unit: 'C' | 'F';
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ weather, air, unit }) => {
  const c = weather.current;
  const hum = c.relative_humidity_2m;
  const dew = calcDewPoint(c.temperature_2m, hum);
  const pres = c.surface_pressure || c.pressure_msl;
  const vis = c.visibility;
  const uv = c.uv_index;
  const gust = c.wind_gusts_10m;
  const cloud = c.cloud_cover;
  const prec = c.precipitation ?? 0;
  const spread = c.temperature_2m - dew;

  // Pressure badge
  const presNote = pres < 1000 ? "LOW" : pres < 1022 ? "NORMAL" : "HIGH";

  // Visibility note
  const visNote = (vis || 0) > 20000 ? "CRYSTAL" : (vis || 0) > 8000 ? "CLEAR" : (vis || 0) > 3000 ? "HAZY" : "FOGGY";

  // UV level
  const getUvInfo = (val: number | null) => {
    if (val == null) return { text: "N/A", desc: "Sensor data unavailable", color: "text-muted" };
    if (val < 3) return { text: "LOW", desc: "No protection needed — enjoy the outdoors!", color: "text-emerald-700" };
    if (val < 6) return { text: "MODERATE", desc: "SPF 30+ recommended if outside > 30 mins", color: "text-amber-700" };
    if (val < 8) return { text: "HIGH", desc: "SPF 50, wide-brim hat & sunglasses midday", color: "text-orange-700" };
    if (val < 11) return { text: "VERY HIGH", desc: "Seek shade, limit direct midday sun exposure", color: "text-red-700" };
    return { text: "EXTREME", desc: "Take all precautions — skin burns rapidly", color: "text-purple-700" };
  };
  const uvInfo = getUvInfo(uv);

  // AQI label
  const aqiMap: Record<number, string> = {
    1: "GOOD",
    2: "FAIR",
    3: "MODERATE",
    4: "POOR",
    5: "VERY POOR"
  };

  const aqi = air?.aqi;
  const aqiLabel = aqi ? aqiMap[aqi] || "FAIR" : "N/A";
  const pm25 = air?.components?.pm2_5;
  const o3 = air?.components?.o3;

  return (
    <div id="environmental-metrics-card" className="card card-hover p-6 sm:p-7">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display font-bold text-[20px] text-ink">Environmental metrics</h2>
        <span className="text-[12.5px] font-bold text-muted">
          Live sensor readings & air quality breakdown
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5 mt-4">
        {/* 1. Humidity */}
        <div className="rounded-3xl bg-[#E6F7ED] p-4.5 card-hover border border-[#CBEBD6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#1E7448] shadow-2xs">
              <Droplets size={20} />
            </div>
            <div>
              <div className="chip text-[#1E7448]">Humidity</div>
              <div className="font-display font-bold text-[23px] text-ink">{hum}%</div>
            </div>
            <div className="ml-auto pill bg-white px-2.5 py-1 text-[11px] font-black text-[#1E7448] shadow-2xs">
              {hum < 30 ? "DRY" : hum < 60 ? "COMFY" : hum < 80 ? "HUMID" : "MUGGY"}
            </div>
          </div>
          <div className="meter-track mt-3 bg-white/70">
            <div
              className="meter-fill bg-gradient-to-r from-[#8AD1B0] to-[#1E7448]"
              style={{ width: `${hum}%` }}
            />
          </div>
          <div className="text-[12px] font-bold text-[#1E7448] mt-2">
            Dew {fmtTemp(dew, unit)} · {hum > 75 ? "Heavy air / humid" : hum < 35 ? "Crisp & dry air" : "Balanced comfort"}
          </div>
        </div>

        {/* 2. Wind & Gusts */}
        <div className="rounded-3xl bg-[#E5F2FC] p-4.5 card-hover border border-[#C6E2F7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#1D6C9F] shadow-2xs">
              <Wind size={20} />
            </div>
            <div>
              <div className="chip text-[#1D6C9F]">Wind & Gusts</div>
              <div className="font-display font-bold text-[23px] text-ink">
                {fmtWind(c.wind_speed_10m, unit)}
              </div>
            </div>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              className="ml-auto bg-white rounded-full p-1.5 shadow-2xs"
              style={{
                transform: `rotate(${c.wind_direction_10m + 180}deg)`,
                transition: "transform 1s"
              }}
            >
              <path d="M12 3l4 9-4-2-4 2 4-9Z" fill="#1D6C9F" />
            </svg>
          </div>
          <div className="text-[12px] font-bold text-[#1D6C9F] mt-2 flex items-center justify-between">
            <span>From {degToCompass(c.wind_direction_10m)} ({Math.round(c.wind_direction_10m)}°)</span>
            <span className="text-ink/70">Gusts {fmtWind(gust, unit)}</span>
          </div>
        </div>

        {/* 3. Pressure */}
        <div className="rounded-3xl bg-[#FFF5CE] p-4.5 card-hover border border-[#F3E29F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#87650C] shadow-2xs">
              <Gauge size={20} />
            </div>
            <div>
              <div className="chip text-[#87650C]">Pressure</div>
              <div className="font-display font-bold text-[23px] text-ink">{fmtPres(pres, unit)}</div>
            </div>
            <div className="ml-auto pill bg-white px-2.5 py-1 text-[11px] font-black text-[#87650C] shadow-2xs">
              {presNote}
            </div>
          </div>
          <div className="meter-track mt-3 bg-white/70">
            <div
              className="meter-fill bg-gradient-to-r from-[#F7D86E] to-[#C99112]"
              style={{ width: `${Math.min(100, Math.max(0, (pres - 960) / 80 * 100))}%` }}
            />
          </div>
          <div className="text-[12px] font-bold text-[#87650C] mt-2">
            {pres < 1000 ? "Low pressure — unsettled weather likely" : pres > 1022 ? "High pressure — calm, clear conditions" : "Stable atmospheric barometer"}
          </div>
        </div>

        {/* 4. Visibility */}
        <div className="rounded-3xl bg-[#EFE9F9] p-4.5 card-hover border border-[#D9CAEF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#5C4D8F] shadow-2xs">
              <Eye size={20} />
            </div>
            <div>
              <div className="chip text-[#5C4D8F]">Visibility</div>
              <div className="font-display font-bold text-[23px] text-ink">{fmtVis(vis, unit)}</div>
            </div>
            <div className="ml-auto pill bg-white px-2.5 py-1 text-[11px] font-black text-[#5C4D8F] shadow-2xs">
              {visNote}
            </div>
          </div>
          <div className="meter-track mt-3 bg-white/70">
            <div
              className="meter-fill bg-gradient-to-r from-[#CBB6F2] to-[#6A52A3]"
              style={{ width: `${Math.min(100, ((vis || 0) / 24000) * 100)}%` }}
            />
          </div>
          <div className="text-[12px] font-bold text-[#5C4D8F] mt-2">
            {(vis || 0) > 8000 ? "Sharp horizons — clear driving & panoramic views" : "Mild atmospheric haze present"}
          </div>
        </div>

        {/* 5. UV Index */}
        <div className="rounded-3xl bg-[#FFF0E0] p-4.5 card-hover border border-[#FAD6B5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#9E5114] shadow-2xs">
              <SunMedium size={20} />
            </div>
            <div>
              <div className="chip text-[#9E5114]">UV Index</div>
              <div className="font-display font-bold text-[23px] text-ink">{uv != null ? uv.toFixed(1) : "N/A"}</div>
            </div>
            <div className={`ml-auto pill bg-white px-2.5 py-1 text-[11px] font-black ${uvInfo.color} shadow-2xs`}>
              {uvInfo.text}
            </div>
          </div>
          <div
            className="relative mt-3 h-[10px] rounded-full"
            style={{ background: 'linear-gradient(90deg,#94D8A2,#F5D66C,#F79E5E,#F26868,#A97DE8)' }}
          >
            {uv != null && (
              <div
                className="absolute w-4 h-4 bg-white border-[3px] border-ink rounded-full -top-[3px] shadow-sm transition-all duration-700"
                style={{ left: `calc(${Math.min(100, (uv / 11) * 100)}% - 8px)` }}
              />
            )}
          </div>
          <div className="text-[12px] font-bold text-[#9E5114] mt-2">
            {uvInfo.desc}
          </div>
        </div>

        {/* 6. Air Quality */}
        <div className="rounded-3xl bg-[#FEECEC] p-4.5 card-hover border border-[#F9CACA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#A63737] shadow-2xs">
              <Activity size={20} />
            </div>
            <div>
              <div className="chip text-[#A63737]">Air Quality</div>
              <div className="font-display font-bold text-[23px] text-ink">
                {aqi ? `AQI ${aqi}/5` : "AQI —"}
              </div>
            </div>
            <div className="ml-auto pill bg-white px-2.5 py-1 text-[11px] font-black text-[#A63737] shadow-2xs">
              {aqiLabel}
            </div>
          </div>
          <div
            className="relative mt-3 h-[10px] rounded-full"
            style={{ background: 'linear-gradient(90deg,#94D8A2,#F5D66C,#F79E5E,#F26868,#7A2E4B)' }}
          >
            {aqi && (
              <div
                className="absolute w-4 h-4 bg-white border-[3px] border-ink rounded-full -top-[3px] shadow-sm transition-all duration-700"
                style={{ left: `calc(${Math.min(100, (aqi / 5) * 100)}% - 8px)` }}
              />
            )}
          </div>
          <div className="text-[12px] font-bold text-[#A63737] mt-2">
            PM2.5 {pm25 != null ? `${pm25.toFixed(1)} µg/m³` : "—"} · O₃ {o3 != null ? `${o3.toFixed(1)} µg/m³` : "—"}
          </div>
        </div>

        {/* 7. Dew Point */}
        <div className="rounded-3xl bg-[#EAF2FA] p-4.5 card-hover border border-[#CBE0F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#2A6596] shadow-2xs">
              <Thermometer size={20} />
            </div>
            <div>
              <div className="chip text-[#2A6596]">Dew Point</div>
              <div className="font-display font-bold text-[23px] text-ink">{fmtTemp(dew, unit)}</div>
            </div>
            <div className="ml-auto pill bg-white px-2.5 py-1 text-[11px] font-black text-[#2A6596] shadow-2xs">
              {dew < 10 ? "CRISP" : dew < 16 ? "COMFY" : dew < 20 ? "MUGGY" : "OPPRESSIVE"}
            </div>
          </div>
          <div className="meter-track mt-3 bg-white/70">
            <div
              className="meter-fill bg-gradient-to-r from-[#90BFEA] to-[#2A6596]"
              style={{ width: `${Math.min(100, Math.max(0, ((dew + 10) / 35) * 100))}%` }}
            />
          </div>
          <div className="text-[12px] font-bold text-[#2A6596] mt-2">
            Temp-Dew spread {fmtTemp(spread, unit)} · {spread < 3 ? "Condensation / fog likely" : "Comfortable dry buffer"}
          </div>
        </div>

        {/* 8. Rain & Clouds */}
        <div className="rounded-3xl bg-[#F0EAF8] p-4.5 card-hover border border-[#DBCDF1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#55408A] shadow-2xs">
              <CloudRain size={20} />
            </div>
            <div>
              <div className="chip text-[#55408A]">Rain & Clouds</div>
              <div className="font-display font-bold text-[23px] text-ink">
                {prec > 0 ? `${fmtPrec(prec, unit)} now` : `${weather.daily.precipitation_probability_max[0] ?? 0}% today`}
              </div>
            </div>
            <div className="ml-auto pill bg-white px-2.5 py-1 text-[11px] font-black text-[#55408A] shadow-2xs">
              {cloud < 20 ? "CLEAR" : cloud < 50 ? "PARTLY" : cloud < 85 ? "MOSTLY" : "OVERCAST"}
            </div>
          </div>
          <div className="meter-track mt-3 bg-white/70">
            <div
              className="meter-fill bg-gradient-to-r from-[#CDBFF0] to-[#55408A]"
              style={{ width: `${cloud}%` }}
            />
          </div>
          <div className="text-[12px] font-bold text-[#55408A] mt-2">
            Cloud cover {cloud}% · {prec > 0 ? "Active precipitation" : "Dry at current observation"}
          </div>
        </div>
      </div>
    </div>
  );
};
