import React from 'react';
import { WeatherData, AirQualityData } from '../types';
import { fmtTemp, fmtVis } from '../utils/weather';
import {
  Car,
  Footprints,
  Bike,
  Sparkles,
  Smile,
  Trees,
  CloudFog,
  Wind,
  Sun,
  Flame,
  Factory,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface LifestyleHealthProps {
  weather: WeatherData;
  air: AirQualityData | null;
  unit: 'C' | 'F';
}

export const LifestyleHealth: React.FC<LifestyleHealthProps> = ({ weather, air, unit }) => {
  const c = weather.current;
  const comp = air?.components || {};
  const aqi = air?.aqi;

  // Pollutant list with Lucide icons
  const pollutants = [
    { name: "PM2.5", val: comp.pm2_5 ?? 0, icon: <CloudFog size={14} className="text-[#55408A]" />, thresholds: [10, 25, 50, 75] },
    { name: "PM10", val: comp.pm10 ?? 0, icon: <Wind size={14} className="text-[#1D6C9F]" />, thresholds: [20, 50, 100, 150] },
    { name: "O₃", val: comp.o3 ?? 0, icon: <Sun size={14} className="text-[#9E5114]" />, thresholds: [60, 100, 140, 180] },
    { name: "NO₂", val: comp.no2 ?? 0, icon: <Car size={14} className="text-[#87650C]" />, thresholds: [40, 70, 150, 200] },
    { name: "SO₂", val: comp.so2 ?? 0, icon: <Factory size={14} className="text-[#555]" />, thresholds: [20, 80, 250, 350] },
    { name: "CO", val: comp.co ?? 0, icon: <Flame size={14} className="text-[#A63737]" />, thresholds: [4400, 9400, 12400, 15400] }
  ];

  // Air overall badge
  const aqiBadgeMap: Record<number, { text: string; bg: string }> = {
    1: { text: "GOOD", bg: "bg-[#E0F5EB] text-[#165C38] border border-[#BEE7D1]" },
    2: { text: "FAIR", bg: "bg-[#E0F5EB] text-[#165C38] border border-[#BEE7D1]" },
    3: { text: "MODERATE", bg: "bg-[#FFF2C7] text-[#7A6214] border border-[#EEDB9F]" },
    4: { text: "POOR", bg: "bg-[#FFE5D6] text-[#8F421E] border border-[#F8CBAC]" },
    5: { text: "VERY POOR", bg: "bg-[#FFE4E9] text-[#932839] border border-[#F9C3CD]" }
  };
  const currentAqiBadge = aqi ? aqiBadgeMap[aqi] || { text: "N/A", bg: "bg-white text-muted border border-line" } : { text: "N/A", bg: "bg-white text-muted border border-line" };

  // Driving Score Calculation
  const vis = c.visibility ?? 10000;
  const pp = weather.daily.precipitation_probability_max[0] ?? 0;
  const code = c.weather_code;
  const wind = c.wind_speed_10m;

  let driveScore = 100;
  const driveTips: string[] = [];

  if (vis < 2000) {
    driveScore -= 40;
    driveTips.push("Dense fog: reduce speed, switch low beams on, leave ample buffer.");
  } else if (vis < 8000) {
    driveScore -= 15;
    driveTips.push("Hazy visibility: maintain headlights on for oncoming traffic.");
  }

  if (pp >= 70) {
    driveScore -= 25;
    driveTips.push("Wet pavement: brake progressively and avoid cruise control.");
  } else if (pp >= 40) {
    driveScore -= 10;
    driveTips.push("Possible passing showers: keep automatic wipers primed.");
  }

  if ([95, 96, 99].includes(code)) {
    driveScore -= 20;
    driveTips.push("Thunderstorm activity: exercise heightened highway caution.");
  }

  if ([71, 73, 75, 85, 86].includes(code)) {
    driveScore -= 25;
    driveTips.push("Snow/ice risk: winter tires, gradual throttle and steering.");
  }

  if (wind >= 50) {
    driveScore -= 15;
    driveTips.push("Gusty crosswinds: firm two-hand steering around high vehicles.");
  }

  if (driveTips.length === 0) {
    driveTips.push("Clear pavement and manageable winds — excellent highway conditions.");
  }

  driveScore = Math.max(10, Math.min(100, driveScore));

  // Outdoor Suitability Calculation
  const t = c.temperature_2m;
  const uv = c.uv_index;
  const gust = c.wind_gusts_10m;

  let outdoorScore = 100;
  if (t < 0 || t > 36) outdoorScore -= 35;
  else if (t < 8 || t > 30) outdoorScore -= 18;
  else if (t >= 17 && t <= 26) outdoorScore += 0;
  else outdoorScore -= 6;

  if (pp > 60) outdoorScore -= 25;
  else if (pp > 30) outdoorScore -= 10;

  if (uv != null) {
    if (uv > 8) outdoorScore -= 12;
    else if (uv > 5) outdoorScore -= 5;
  }

  if (aqi && aqi >= 4) outdoorScore -= 25;
  else if (aqi && aqi >= 3) outdoorScore -= 12;

  if (gust > 50) outdoorScore -= 12;
  else if (gust > 35) outdoorScore -= 6;

  if ((comp.pm2_5 || 0) > 35) outdoorScore -= 10;

  outdoorScore = Math.max(10, Math.min(100, outdoorScore));

  const outdoorLabel =
    outdoorScore >= 80
      ? { text: "Optimal outdoor conditions", color: "text-emerald-700" }
      : outdoorScore >= 60
      ? { text: "Pleasant outdoor window", color: "text-emerald-700" }
      : outdoorScore >= 40
      ? { text: "Fair — pack a warm layer", color: "text-amber-700" }
      : { text: "Indoor activities recommended", color: "text-rose-700" };

  // Activity suitability flags
  const isDaytime = c.is_day === 1;
  const isRaining = pp > 30 || c.precipitation > 0.5;
  const isWindy = wind > 32;
  const isHot = t > 32;
  const isCold = t < 6;
  const isFoggy = vis < 2000;
  const isStormy = [95, 96, 99].includes(code);
  const isSnowing = [71, 73, 75, 77, 85, 86].includes(code);
  const uvExcessive = uv != null && uv > 8;
  const aqiSuboptimal = aqi != null && aqi >= 4;

  const activities = [
    {
      name: "Jogging",
      icon: <Footprints size={15} />,
      suitable: isDaytime && !isRaining && !isWindy && !isHot && !isCold && !isFoggy && !isStormy && !isSnowing && !aqiSuboptimal,
      tooltip: "Best: daylight, dry path, mild temperature, clean air"
    },
    {
      name: "Park & Picnic",
      icon: <Trees size={15} />,
      suitable: isDaytime && !isRaining && !isWindy && !isHot && !isCold && !isStormy && !isSnowing && !uvExcessive && !aqiSuboptimal,
      tooltip: "Best: sunshine, moderate breeze, dry grass, safe UV"
    },
    {
      name: "Cycling",
      icon: <Bike size={15} />,
      suitable: !isRaining && !isStormy && !isSnowing && wind < 38 && !isFoggy && !aqiSuboptimal,
      tooltip: "Best: dry road, manageable crosswind, clear sightlines"
    },
    {
      name: "Stargazing",
      icon: <Sparkles size={15} />,
      suitable: !isDaytime && c.cloud_cover < 40 && !isRaining && !isFoggy && !isStormy,
      tooltip: "Best: nighttime, low cloud cover, minimal atmospheric haze"
    }
  ];

  return (
    <div id="health-lifestyle-card" className="card card-hover p-6 sm:p-7 flex flex-col gap-5 justify-between">
      {/* 1. Pollutants & Air Quality */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-[20px] text-ink">Health & lifestyle</h2>
          <span className={`pill px-3 py-1 text-[11px] font-black shadow-2xs ${currentAqiBadge.bg}`}>
            {currentAqiBadge.text}
          </span>
        </div>
        <p className="text-[13px] font-bold text-muted mt-0.5">
          Real-time air pollutants, driving risk & outdoor recommendations
        </p>

        <div className="mt-3.5 space-y-2">
          {pollutants.map((p) => {
            const th = p.thresholds;
            const lvl =
              p.val < th[0]
                ? { label: "Good", color: "text-emerald-700", bg: "bg-emerald-500" }
                : p.val < th[1]
                ? { label: "Fair", color: "text-amber-700", bg: "bg-amber-500" }
                : p.val < th[2]
                ? { label: "Moderate", color: "text-orange-700", bg: "bg-orange-500" }
                : p.val < th[3]
                ? { label: "Poor", color: "text-red-700", bg: "bg-red-500" }
                : { label: "Very poor", color: "text-purple-800", bg: "bg-purple-600" };

            const pct = Math.min(100, (p.val / th[3]) * 100);

            return (
              <div key={p.name} className="flex items-center gap-2.5 text-[12.5px] font-bold">
                <span className="w-7 h-7 rounded-xl bg-white border border-line flex items-center justify-center shadow-2xs">
                  {p.icon}
                </span>
                <span className="w-[52px] text-ink font-extrabold">{p.name}</span>
                <div className="flex-1 meter-track !h-[8px] bg-[#EAE5DF]">
                  <div className={`meter-fill ${lvl.bg}`} style={{ width: `${pct}%` }} />
                </div>
                <span className={`w-[95px] text-right font-extrabold ${lvl.color}`}>
                  {p.val.toFixed(1)} · {lvl.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-line/80"></div>

      {/* 2. Driving Conditions */}
      <div>
        <div className="flex items-center justify-between">
          <div className="font-display font-bold text-[16px] flex items-center gap-2 text-ink">
            <Car size={18} className="text-[#1D6C9F]" />
            <span>Driving conditions</span>
          </div>
          <div className="font-display font-bold text-[18px] text-ink">{driveScore}/100</div>
        </div>
        <div className="meter-track mt-2.5 bg-[#EAE5DF]">
          <div
            className="meter-fill bg-gradient-to-r from-[#F87171] via-[#FBBF24] to-[#34D399]"
            style={{ width: `${driveScore}%` }}
          />
        </div>
        <div
          className={`mt-1.5 text-[12.5px] font-extrabold ${
            driveScore >= 80 ? 'text-emerald-700' : driveScore >= 60 ? 'text-amber-700' : 'text-rose-700'
          }`}
        >
          {driveScore >= 80
            ? "Excellent — dry pavement, smooth travel conditions"
            : driveScore >= 60
            ? "Good — seasonal caution advised"
            : "Caution — wet asphalt or low visibility"}
        </div>
        <ul className="mt-1.5 text-[12.5px] font-semibold text-ink/80 space-y-1 leading-snug">
          {driveTips.map((tip, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-ink/40">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="h-px bg-line/80"></div>

      {/* 3. Outdoor Suitability & Activities */}
      <div>
        <div className="flex items-center justify-between">
          <div className="font-display font-bold text-[16px] flex items-center gap-2 text-ink">
            <Smile size={18} className="text-[#1E7448]" />
            <span>Outdoor suitability</span>
          </div>
          <div className="font-display font-bold text-[18px] text-ink">{outdoorScore}/100</div>
        </div>
        <div className="meter-track mt-2.5 bg-[#EAE5DF]">
          <div
            className="meter-fill bg-gradient-to-r from-[#F87171] via-[#FCD34D] to-[#34D399]"
            style={{ width: `${outdoorScore}%` }}
          />
        </div>
        <div className={`mt-1.5 text-[12.5px] font-extrabold ${outdoorLabel.color}`}>
          {outdoorLabel.text}
        </div>

        {/* Dynamic Activity Checkmarks */}
        <div className="grid grid-cols-2 gap-2 mt-2.5">
          {activities.map((act) => (
            <div
              key={act.name}
              title={act.tooltip}
              className={`rounded-xl border px-3 py-2 text-[12.5px] font-extrabold flex items-center gap-2 transition ${
                act.suitable
                  ? 'bg-[#EAF7EE] text-[#1B633D] border-[#BDE7CB] shadow-2xs'
                  : 'bg-[#F7F4F0] text-muted border-line opacity-75'
              }`}
            >
              <span className="shrink-0">{act.icon}</span>
              <span className="truncate">{act.name}</span>
              <span className="ml-auto shrink-0">
                {act.suitable ? (
                  <CheckCircle2 size={15} className="text-[#1B633D]" />
                ) : (
                  <XCircle size={15} className="text-muted/60" />
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3.5 rounded-2xl bg-butter p-3 text-[12.5px] font-bold text-butter-dark leading-snug border border-[#EEDB9F] shadow-2xs">
          {outdoorScore >= 70
            ? `Light comfortable layers recommended — ${fmtTemp(t, unit)} is well suited for activities.`
            : outdoorScore >= 45
            ? `Check rain radar prior to leaving; feels like ${fmtTemp(c.apparent_temperature, unit)}.`
            : `Ideal time for indoor routines: visibility ${fmtVis(vis, unit)}, AQI ${aqi ?? "—"}/5.`}
        </div>
      </div>
    </div>
  );
};
