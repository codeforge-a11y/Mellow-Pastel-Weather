import { PlaceLocation, WeatherData, AirQualityData, WeatherAlert, RadarFrame } from '../types';

export const OWM_KEY: string = (import.meta.env.VITE_OWM_KEY as string | undefined)?.trim() || "";
export const OWM_BASE = "https://api.openweathermap.org";

export function fmtTemp(c: number | null | undefined, unit: 'C' | 'F'): string {
  if (c == null) return "--";
  return unit === 'C' ? `${Math.round(c)}°` : `${Math.round(c * 9 / 5 + 32)}°`;
}

export function fmtTempNum(c: number | null | undefined, unit: 'C' | 'F'): number | string {
  if (c == null) return "--";
  return unit === 'C' ? Math.round(c) : Math.round(c * 9 / 5 + 32);
}

export function fmtWind(kmh: number | null | undefined, unit: 'C' | 'F'): string {
  if (kmh == null) return "--";
  return unit === 'C' ? `${Math.round(kmh)} km/h` : `${Math.round(kmh * 0.621371)} mph`;
}

export function fmtWindNum(kmh: number | null | undefined, unit: 'C' | 'F'): number | string {
  if (kmh == null) return "--";
  return unit === 'C' ? Math.round(kmh) : Math.round(kmh * 0.621371);
}

export function fmtVis(m: number | null | undefined, unit: 'C' | 'F'): string {
  if (m == null) return "--";
  return unit === 'C' ? `${(m / 1000).toFixed(1)} km` : `${(m / 1609.344).toFixed(1)} mi`;
}

export function fmtPres(h: number | null | undefined, unit: 'C' | 'F'): string {
  if (h == null) return "--";
  return unit === 'C' ? `${Math.round(h)} hPa` : `${(h * 0.02953).toFixed(2)} inHg`;
}

export function fmtPrec(mm: number | null | undefined, unit: 'C' | 'F'): string {
  if (mm == null) return "--";
  return unit === 'C' ? `${mm.toFixed(1)} mm` : `${(mm * 0.03937).toFixed(2)} in`;
}

export function degToCompass(d: number = 0): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round((d || 0) / 22.5) % 16];
}

export function calcDewPoint(t: number | null | undefined, rh: number | null | undefined): number {
  if (t == null || rh == null || rh <= 0) return t ?? 0;
  const a = 17.62, b = 243.12;
  const alpha = ((a * t) / (b + t)) + Math.log(rh / 100);
  return (b * alpha) / (a - alpha);
}

export function localDate(unixSec: number, tzOffsetSec: number): Date {
  return new Date((unixSec + tzOffsetSec) * 1000);
}

export function isoLocal(unixSec: number, tzOffsetSec: number): string {
  return localDate(unixSec, tzOffsetSec).toISOString();
}

export function fmtClock(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
  } catch {
    return "--:--";
  }
}

export function fmtHour(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", timeZone: "UTC" });
  } catch {
    return "--";
  }
}

export function fmtDayShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  } catch {
    return "--";
  }
}

export function fmtDayFull(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
  } catch {
    return iso;
  }
}

export function fmtDur(sec: number | null | undefined): string {
  if (sec == null) return "--";
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return `${h}h ${m}m`;
}

export function offsetLabel(sec: number = 0): string {
  const sign = sec < 0 ? "-" : "+";
  const abs = Math.abs(sec);
  const h = String(Math.floor(abs / 3600)).padStart(2, "0");
  const m = String(Math.floor((abs % 3600) / 60)).padStart(2, "0");
  return `UTC${sign}${h}:${m}`;
}

export function nowLocal(tzOffsetSec: number): string {
  const d = new Date(Date.now() + tzOffsetSec * 1000);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(d);
}

export function titleCase(s: string = ""): string {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

export function countryName(cc: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(cc.toUpperCase()) || cc;
  } catch {
    return cc;
  }
}

export function getFlagEmoji(countryCode: string): string {
  const code = (countryCode || "").toUpperCase();
  if (code.length !== 2) return "🌍";
  const offset = 127397;
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
}

export const WMO: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Storm + hail",
  99: "Storm + hail"
};

export function wmoLabel(c: number): string {
  return WMO[c] ?? "—";
}

export function owmToWmo(id: number): number {
  if (id === 800) return 0;
  if (id === 801) return 1;
  if (id === 802) return 2;
  if (id === 803 || id === 804) return 3;
  if (id >= 701 && id <= 781) return 45;
  if (id >= 300 && id <= 321) return 51;
  if (id === 500) return 61;
  if (id === 501) return 63;
  if (id >= 502 && id <= 504) return 65;
  if (id === 511) return 66;
  if (id >= 520 && id <= 531) return 80;
  if (id === 600) return 71;
  if (id === 601) return 73;
  if (id === 602) return 75;
  if (id >= 611 && id <= 616) return 77;
  if (id >= 620 && id <= 622) return 85;
  if (id >= 200 && id <= 232) return 95;
  return 2;
}

export function moonPhase(date: Date) {
  const syn = 29.53058867;
  const known = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
  const now = date.getTime() / 86400000;
  let age = (now - known) % syn;
  if (age < 0) age += syn;
  const illum = (1 - Math.cos(2 * Math.PI * age / syn)) / 2;
  const idx = Math.floor(age / syn * 8 + 0.5) % 8;
  const names = [
    "New Moon",
    "Waxing Crescent",
    "First Quarter",
    "Waxing Gibbous",
    "Full Moon",
    "Waning Gibbous",
    "Last Quarter",
    "Waning Crescent"
  ];
  return { age, illum, idx, name: names[idx] };
}

export async function searchPlacesOpenMeteo(q: string): Promise<PlaceLocation[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  if (!data.results) return [];
  return data.results.map((p: any) => ({
    lat: p.latitude,
    lon: p.longitude,
    name: p.name,
    country: p.country || "",
    cc: p.country_code || "",
    admin: p.admin1 || p.admin2 || ""
  }));
}

export async function fetchWeatherDetails(lat: number, lon: number): Promise<{
  weather: WeatherData;
  air: AirQualityData | null;
  tzOffsetSec: number;
}> {
  if (!OWM_KEY) {
    throw new Error("Missing OpenWeatherMap API key. Please configure VITE_OWM_KEY in your .env file or repository secrets.");
  }

  const curUrl = `${OWM_BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`;
  const fcUrl = `${OWM_BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`;
  const airUrl = `${OWM_BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_KEY}`;
  const uviUrl = `${OWM_BASE}/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${OWM_KEY}`;

  const [curR, fcR, airR, uviR] = await Promise.allSettled([
    fetch(curUrl).then(r => r.json()),
    fetch(fcUrl).then(r => r.json()),
    fetch(airUrl).then(r => r.json()),
    fetch(uviUrl).then(r => r.json())
  ]);

  const cur = curR.status === 'fulfilled' ? curR.value : null;
  const fc = fcR.status === 'fulfilled' ? fcR.value : null;
  const air = airR.status === 'fulfilled' ? airR.value : null;
  const uvi = uviR.status === 'fulfilled' && typeof uviR.value?.value === 'number' ? uviR.value.value : null;

  if (!cur || !cur.weather || !cur.main) {
    throw new Error(cur?.message || "Current weather unavailable");
  }
  if (!fc || !Array.isArray(fc.list)) {
    throw new Error(fc?.message || "Forecast unavailable");
  }

  const tzOffsetSec = cur.timezone ?? fc.city?.timezone ?? 0;
  const curIcon = cur.weather?.[0]?.icon || "01d";
  const curIsDay = curIcon.endsWith("d") ? 1 : 0;
  const curCode = owmToWmo(cur.weather?.[0]?.id ?? 800);
  const windKmh = (cur.wind?.speed || 0) * 3.6;
  const gustKmh = (cur.wind?.gust != null ? cur.wind.gust : (cur.wind?.speed || 0) * 1.25) * 3.6;
  const precipNow = (cur.rain?.["1h"]) || (cur.snow?.["1h"]) || 0;

  const current: WeatherData['current'] = {
    time: isoLocal(cur.dt, tzOffsetSec),
    temperature_2m: cur.main.temp,
    apparent_temperature: cur.main.feels_like,
    relative_humidity_2m: cur.main.humidity,
    is_day: curIsDay,
    precipitation: precipNow,
    weather_code: curCode,
    description: titleCase(cur.weather?.[0]?.description),
    cloud_cover: cur.clouds?.all ?? 0,
    pressure_msl: cur.main.pressure,
    surface_pressure: cur.main.grnd_level ?? cur.main.pressure,
    wind_speed_10m: windKmh,
    wind_direction_10m: cur.wind?.deg ?? 0,
    wind_gusts_10m: gustKmh,
    visibility: cur.visibility ?? null,
    uv_index: uvi
  };

  const h: WeatherData['hourly'] = {
    time: [],
    temperature_2m: [],
    relative_humidity_2m: [],
    dew_point_2m: [],
    apparent_temperature: [],
    precipitation_probability: [],
    precipitation: [],
    weather_code: [],
    description: [],
    cloud_cover: [],
    pressure_msl: [],
    visibility: [],
    wind_speed_10m: [],
    wind_direction_10m: [],
    wind_gusts_10m: [],
    uv_index: [],
    is_day: []
  };

  fc.list.forEach((it: any) => {
    const icon = it.weather?.[0]?.icon || "01d";
    const isDay = icon.endsWith("d") ? 1 : 0;
    const code = owmToWmo(it.weather?.[0]?.id ?? 800);
    const wKmh = (it.wind?.speed || 0) * 3.6;
    const gKmh = (it.wind?.gust != null ? it.wind.gust : (it.wind?.speed || 0) * 1.25) * 3.6;
    const rain3h = it.rain?.["3h"] || 0;
    const snow3h = it.snow?.["3h"] || 0;

    h.time.push(isoLocal(it.dt, tzOffsetSec));
    h.temperature_2m.push(it.main.temp);
    h.relative_humidity_2m.push(it.main.humidity);
    h.dew_point_2m.push(calcDewPoint(it.main.temp, it.main.humidity));
    h.apparent_temperature.push(it.main.feels_like);
    h.precipitation_probability.push(Math.round((it.pop || 0) * 100));
    h.precipitation.push(rain3h + snow3h);
    h.weather_code.push(code);
    h.description.push(titleCase(it.weather?.[0]?.description));
    h.cloud_cover.push(it.clouds?.all ?? 0);
    h.pressure_msl.push(it.main.pressure);
    h.visibility.push(it.visibility ?? null);
    h.wind_speed_10m.push(wKmh);
    h.wind_direction_10m.push(it.wind?.deg ?? 0);
    h.wind_gusts_10m.push(gKmh);
    h.uv_index.push(uvi);
    h.is_day.push(isDay);
  });

  const groups: Record<string, any[]> = {};
  fc.list.forEach((it: any) => {
    const key = isoLocal(it.dt, tzOffsetSec).slice(0, 10);
    (groups[key] = groups[key] || []).push(it);
  });

  const dayKeys = Object.keys(groups).sort().slice(0, 5);
  const sunriseIso = isoLocal(cur.sys.sunrise, tzOffsetSec);
  const sunsetIso = isoLocal(cur.sys.sunset, tzOffsetSec);
  const daylightSec = Math.max(0, cur.sys.sunset - cur.sys.sunrise);

  const d: WeatherData['daily'] = {
    time: [],
    weather_code: [],
    description: [],
    temperature_2m_max: [],
    temperature_2m_min: [],
    sunrise: [],
    sunset: [],
    daylight_duration: [],
    uv_index_max: [],
    precipitation_probability_max: [],
    precipitation_sum: [],
    wind_speed_10m_max: [],
    wind_gusts_10m_max: [],
    wind_direction_10m_dominant: []
  };

  dayKeys.forEach(k => {
    const entries = groups[k];
    const temps = entries.map(e => e.main.temp);
    const winds = entries.map(e => (e.wind?.speed || 0) * 3.6);
    const gusts = entries.map(e => (e.wind?.gust != null ? e.wind.gust : (e.wind?.speed || 0) * 1.25) * 3.6);
    const pops = entries.map(e => Math.round((e.pop || 0) * 100));
    const precs = entries.map(e => (e.rain?.["3h"] || 0) + (e.snow?.["3h"] || 0));

    let rep = entries[0];
    let bestDiff = 99;
    entries.forEach(e => {
      const hr = new Date(isoLocal(e.dt, tzOffsetSec)).getUTCHours();
      const diff = Math.abs(hr - 13);
      if (diff < bestDiff) {
        bestDiff = diff;
        rep = e;
      }
    });

    const maxWindIdx = winds.indexOf(Math.max(...winds));
    d.time.push(k);
    d.weather_code.push(owmToWmo(rep.weather?.[0]?.id ?? 800));
    d.description.push(titleCase(rep.weather?.[0]?.description));
    d.temperature_2m_max.push(Math.max(...temps));
    d.temperature_2m_min.push(Math.min(...temps));
    d.sunrise.push(sunriseIso);
    d.sunset.push(sunsetIso);
    d.daylight_duration.push(daylightSec);
    d.uv_index_max.push(uvi);
    d.precipitation_probability_max.push(Math.max(...pops));
    d.precipitation_sum.push(precs.reduce((a, b) => a + b, 0));
    d.wind_speed_10m_max.push(Math.max(...winds));
    d.wind_gusts_10m_max.push(Math.max(...gusts));
    d.wind_direction_10m_dominant.push(entries[maxWindIdx]?.wind?.deg ?? 0);
  });

  if (d.temperature_2m_max.length > 0) {
    d.temperature_2m_max[0] = Math.max(d.temperature_2m_max[0], cur.main.temp);
    d.temperature_2m_min[0] = Math.min(d.temperature_2m_min[0], cur.main.temp);
  }

  let airData: AirQualityData | null = null;
  if (air && Array.isArray(air.list) && air.list.length > 0) {
    const item = air.list[0];
    airData = {
      aqi: item.main?.aqi,
      components: item.components || {}
    };
  }

  return {
    weather: { current, hourly: h, daily: d },
    air: airData,
    tzOffsetSec
  };
}

export async function fetchNWSAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
  const inUS = lat > 23 && lat < 50 && lon > -130 && lon < -64;
  if (!inUS) return [];
  try {
    const r = await fetch(`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`, {
      headers: { Accept: "application/geo+json" }
    });
    if (!r.ok) return [];
    const j = await r.json();
    return (j.features || []).slice(0, 4).map((f: any) => {
      const sev = (f.properties.severity || "Moderate").toLowerCase();
      const mappedSev = sev.includes("extreme") ? 'extreme' : sev.includes("severe") ? 'severe' : 'moderate';
      const eventName = f.properties.event || "Weather Alert";
      return {
        id: f.id || f.properties?.id || `nws_${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${lat.toFixed(2)}_${lon.toFixed(2)}`,
        sev: mappedSev,
        title: "⚠️ " + eventName,
        desc: f.properties.headline || f.properties.description || "",
        inst: f.properties.instruction || "",
        area: f.properties.areaDesc || "",
        icon: "📢"
      };
    });
  } catch {
    return [];
  }
}

export function getAlertId(alert: WeatherAlert): string {
  if (alert.id) return alert.id;
  const cleanTitle = alert.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const cleanArea = (alert.area || '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `${cleanTitle}_${alert.sev}_${cleanArea}`;
}

export function buildDerivedAlerts(weather: WeatherData, air: AirQualityData | null, unit: 'C' | 'F'): WeatherAlert[] {
  const d = weather.daily;
  const arr: WeatherAlert[] = [];
  const tmax = Math.max(...d.temperature_2m_max.slice(0, 2));
  const tmin = Math.min(...d.temperature_2m_min.slice(0, 2));
  const wmax = Math.max(...d.wind_speed_10m_max.slice(0, 2));
  const pmax = Math.max(...(d.precipitation_probability_max.slice(0, 2) || [0]));
  const uvVals = (d.uv_index_max.slice(0, 2) || []).filter((v): v is number => v != null);
  const uvmax = uvVals.length ? Math.max(...uvVals) : null;
  const vis = weather.current.visibility;
  const codes = [...d.weather_code.slice(0, 2)];
  const hasStorm = codes.some(c => [95, 96, 99].includes(c));
  const hasSnow = codes.some(c => [71, 73, 75, 77, 85, 86].includes(c));
  const hasRain = codes.some(c => [61, 63, 65, 66, 67, 80, 81, 82].includes(c));

  if (tmax >= 35) {
    arr.push({
      id: "derived_extreme_heat",
      sev: "extreme",
      title: "Extreme Heat Warning",
      desc: `Highs near ${fmtTemp(tmax, unit)}. Stay hydrated, avoid midday sun, check on vulnerable neighbors.`,
      icon: "🥵"
    });
  }
  if (tmin <= -8) {
    arr.push({
      id: "derived_extreme_cold",
      sev: "extreme",
      title: "Extreme Cold Advisory",
      desc: `Lows near ${fmtTemp(tmin, unit)}. Layer up, protect pipes and pets, limit exposure.`,
      icon: "🥶"
    });
  }
  if (hasStorm) {
    arr.push({
      id: "derived_thunderstorm",
      sev: "severe",
      title: "Thunderstorm Risk",
      desc: "Lightning and sudden heavy downpours possible. Unplug sensitives and avoid tall trees.",
      icon: "⛈️"
    });
  }
  if (wmax >= 60) {
    arr.push({
      id: "derived_high_wind",
      sev: "severe",
      title: "High Wind Advisory",
      desc: `Gusts up to ${fmtWind(wmax, unit)}. Secure loose patio items, drive with both hands.`,
      icon: "💨"
    });
  }
  if (pmax >= 70 && hasRain) {
    arr.push({
      id: "derived_heavy_rain",
      sev: "severe",
      title: "Heavy Rain / Flood Watch",
      desc: `Rain probability ${pmax}% with ponding possible. Avoid flooded roads.`,
      icon: "🌊"
    });
  }
  if (hasSnow) {
    arr.push({
      id: "derived_snow",
      sev: "moderate",
      title: "Snow Notice",
      desc: "Slippery roads and walkways likely. Allow extra travel time.",
      icon: "❄️"
    });
  }
  if (vis != null && vis < 1200) {
    arr.push({
      id: "derived_dense_fog",
      sev: "moderate",
      title: "Dense Fog Alert",
      desc: `Visibility reduced to ${fmtVis(vis, unit)}. Use low beams and increase following distance.`,
      icon: "🌫️"
    });
  }
  if (uvmax != null && uvmax >= 8) {
    arr.push({
      id: "derived_high_uv",
      sev: "moderate",
      title: "High UV Radiation",
      desc: `UV index reaching ${uvmax.toFixed(0)}. Use SPF 50+, hat, and sunglasses midday.`,
      icon: "🧴"
    });
  }
  if (air?.aqi != null && air.aqi >= 4) {
    arr.push({
      id: "derived_unhealthy_air",
      sev: "moderate",
      title: "Unhealthy Air Quality",
      desc: `Air pollution index ${air.aqi}/5. Sensitive groups should avoid strenuous outdoor exertion.`,
      icon: "😷"
    });
  }

  return arr;
}
