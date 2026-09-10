import React, { useState } from 'react';
import { PlaceLocation, WeatherData } from '../types';
import { WeatherIcon } from './WeatherIcon';
import {
  fmtTemp,
  fmtTempNum,
  fmtWind,
  fmtVis,
  degToCompass,
  nowLocal,
  offsetLabel
} from '../utils/weather';
import { downloadWeatherSummaryCardImage } from '../utils/weatherCardImage';
import { Star, Share2, MapPin, Droplets, SunMedium, Eye, CloudRain, Download, Check, Loader2 } from 'lucide-react';

interface CurrentWeatherProps {
  location: PlaceLocation;
  weather: WeatherData;
  unit: 'C' | 'F';
  tzOffsetSec: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
}

export const CurrentWeather: React.FC<CurrentWeatherProps> = ({
  location,
  weather,
  unit,
  tzOffsetSec,
  isFavorite,
  onToggleFavorite,
  onShare
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const c = weather.current;
  const hi = weather.daily.temperature_2m_max[0];
  const lo = weather.daily.temperature_2m_min[0];
  const precipProb = weather.daily.precipitation_probability_max[0] ?? 0;

  // Converts the current weather data into a beautiful card image & downloads as PNG in-browser
  const handleDownloadSummary = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadWeatherSummaryCardImage({
        location,
        weather,
        unit,
        tzOffsetSec
      });
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to generate weather summary card image:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Determine dynamic gradient based on weather condition & day/night
  const getHeroClass = (code: number, isDay: number) => {
    if (isDay === 0) return 'hero-grad-night';
    if ([95, 96, 99].includes(code)) return 'hero-grad-day-storm';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'hero-grad-day-snow';
    if ([61, 63, 65, 66, 67, 80, 81, 82, 51, 53, 55, 56, 57].includes(code)) return 'hero-grad-day-rain';
    if ([3, 45, 48].includes(code)) return 'hero-grad-day-cloud';
    if (code === 2) return 'hero-grad-day-cloud';
    return 'hero-grad-day-clear';
  };

  const heroTheme = getHeroClass(c.weather_code, c.is_day);

  return (
    <div id="current-weather-card" className={`card card-hover relative overflow-hidden p-6 sm:p-8 ${heroTheme}`}>
      {/* Subtle texture overlay */}
      <img
        src="https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=900&q=60&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-[0.06] pointer-events-none"
      />

      <div className="relative">
        {/* Top bar with location name, live badge, and action buttons */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="pill bg-white/90 backdrop-blur px-3 py-1 text-[11.5px] font-black flex items-center gap-1.5 shadow-2xs border border-white/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot inline-block"></span>
                <span className="text-emerald-800 tracking-wider">LIVE</span>
              </span>
              <span className="text-[12.5px] font-bold text-ink/75">
                {nowLocal(tzOffsetSec)} · {offsetLabel(tzOffsetSec)}
              </span>
            </div>

            <h1 className="font-display font-bold text-[32px] sm:text-[42px] leading-tight mt-2 flex items-center gap-2.5 flex-wrap text-ink">
              <MapPin size={28} className="text-ink/80 shrink-0" />
              <span>{location.name}</span>
            </h1>

            <div className="text-[13.5px] font-bold text-ink/70 mt-0.5">
              {[location.admin, location.country].filter(Boolean).join(" · ")} • {Math.abs(location.lat).toFixed(2)}°{location.lat >= 0 ? "N" : "S"}{" "}
              {Math.abs(location.lon).toFixed(2)}°{location.lon >= 0 ? "E" : "W"}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              id="download-weather-summary-btn"
              type="button"
              onClick={handleDownloadSummary}
              disabled={downloading}
              title={
                downloading
                  ? "Converting weather data into card image..."
                  : downloaded
                  ? "Card image downloaded!"
                  : "Download Weather Summary (PNG card image)"
              }
              aria-label="Download Weather Summary"
              className={`h-11 px-3 sm:px-4 rounded-2xl border shadow-card flex items-center gap-2 hover:scale-[1.03] active:scale-95 transition cursor-pointer disabled:opacity-75 ${
                downloaded
                  ? 'bg-[#E5F5EC] text-[#1E7448] border-[#BDE7CB]'
                  : downloading
                  ? 'bg-white text-ink/80 border-white'
                  : 'bg-white/95 text-ink/80 hover:text-ink border-white'
              }`}
            >
              {downloading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-ink shrink-0" />
                  <span className="text-[12.5px] font-bold hidden sm:inline whitespace-nowrap">
                    Generating...
                  </span>
                </>
              ) : downloaded ? (
                <>
                  <Check size={18} strokeWidth={2.5} className="text-[#1E7448] shrink-0" />
                  <span className="text-[12.5px] font-bold hidden sm:inline whitespace-nowrap text-[#1E7448]">
                    Downloaded!
                  </span>
                </>
              ) : (
                <>
                  <Download size={18} strokeWidth={2} className="shrink-0" />
                  <span className="text-[12.5px] font-bold hidden sm:inline whitespace-nowrap">
                    Download Weather Summary
                  </span>
                </>
              )}
            </button>
            <button
              id="toggle-favorite-btn"
              onClick={onToggleFavorite}
              title={isFavorite ? "Remove from pinned cities" : "Pin this city to top bar"}
              className={`w-11 h-11 rounded-2xl shadow-card flex items-center justify-center hover:scale-105 active:scale-95 transition border cursor-pointer ${
                isFavorite
                  ? 'bg-butter text-amber-600 border-[#EADB9E]'
                  : 'bg-white/95 text-ink/70 hover:text-ink border-white'
              }`}
            >
              <Star size={20} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2} />
            </button>
            <button
              id="share-location-btn"
              onClick={onShare}
              title="Share weather card (card-wise preview & export)"
              aria-label="Share weather card"
              className="w-11 h-11 rounded-2xl bg-white/95 border border-white shadow-card flex items-center justify-center hover:scale-105 active:scale-95 transition text-ink cursor-pointer"
            >
              <Share2 size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Center weather section */}
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
          <div
            className="shrink-0"
            style={{ animation: "floaty 5s ease-in-out infinite" }}
          >
            <WeatherIcon
              code={c.weather_code}
              isDay={c.is_day === 1}
              size={114}
            />
          </div>

          <div className="text-center sm:text-left">
            <div className="flex items-start justify-center sm:justify-start gap-1">
              <span className="font-display font-bold leading-none tracking-tight text-[80px] sm:text-[96px] text-ink">
                {fmtTempNum(c.temperature_2m, unit)}
              </span>
              <span className="font-display font-bold text-2xl mt-3 text-ink/70">
                °{unit}
              </span>
            </div>

            <div className="font-display font-bold text-[21px] -mt-1 text-ink">
              {c.description}
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2.5">
              <span className="pill bg-white/90 border border-white/60 px-3.5 py-1 text-[13px] font-extrabold shadow-2xs text-ink">
                Feels {fmtTemp(c.apparent_temperature, unit)}
              </span>
              <span className="pill bg-white/90 border border-white/60 px-3.5 py-1 text-[13px] font-extrabold shadow-2xs text-ink">
                H {fmtTemp(hi, unit)} · L {fmtTemp(lo, unit)}
              </span>
              <span className="pill bg-[#E6EFF7] border border-[#CCE0F2] px-3.5 py-1 text-[13px] font-extrabold shadow-2xs flex items-center gap-1.5 text-[#1E5C88]">
                <CloudRain size={14} />
                <span>{precipProb}% precip</span>
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex-1 w-full sm:w-auto grid grid-cols-2 gap-3 sm:ml-auto sm:max-w-[320px]">
            {/* Wind with rotating compass arrow */}
            <div className="rounded-2xl bg-white/90 border border-white/70 p-3.5 shadow-2xs flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-xl bg-[#E6EFF7] flex items-center justify-center shrink-0">
                <span className="absolute text-[8px] font-black text-[#1E5C88] top-0.5">N</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  style={{
                    transform: `rotate(${c.wind_direction_10m + 180}deg)`,
                    transition: "transform 1s cubic-bezier(.22,1,.36,1)"
                  }}
                >
                  <path d="M12 3l4 9-4-2-4 2 4-9Z" fill="#1E5C88" />
                  <path d="M12 14v7" stroke="#1E5C88" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className="font-display font-bold text-[16.5px] leading-none text-ink">
                  {fmtWind(c.wind_speed_10m, unit)}
                </div>
                <div className="text-[11px] font-bold text-muted mt-1">
                  {degToCompass(c.wind_direction_10m)} wind
                </div>
              </div>
            </div>

            {/* Humidity */}
            <div className="rounded-2xl bg-white/90 border border-white/70 p-3.5 shadow-2xs flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#E5F5EC] text-[#1E7448] flex items-center justify-center shrink-0">
                <Droplets size={20} />
              </div>
              <div>
                <div className="font-display font-bold text-[16.5px] leading-none text-ink">
                  {c.relative_humidity_2m}%
                </div>
                <div className="text-[11px] font-bold text-muted mt-1">Humidity</div>
              </div>
            </div>

            {/* UV Index */}
            <div className="rounded-2xl bg-white/90 border border-white/70 p-3.5 shadow-2xs flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#FFF3D6] text-[#8C5D08] flex items-center justify-center shrink-0">
                <SunMedium size={20} />
              </div>
              <div>
                <div className="font-display font-bold text-[16.5px] leading-none text-ink">
                  {c.uv_index != null ? c.uv_index.toFixed(1) : "N/A"}
                </div>
                <div className="text-[11px] font-bold text-muted mt-1">UV index</div>
              </div>
            </div>

            {/* Visibility */}
            <div className="rounded-2xl bg-white/90 border border-white/70 p-3.5 shadow-2xs flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#EFE9F9] text-[#5C4D8F] flex items-center justify-center shrink-0">
                <Eye size={20} />
              </div>
              <div>
                <div className="font-display font-bold text-[16.5px] leading-none text-ink">
                  {fmtVis(c.visibility, unit)}
                </div>
                <div className="text-[11px] font-bold text-muted mt-1">Visibility</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Badges */}
        <div className="mt-5 flex flex-wrap gap-2 text-[12px] font-bold text-ink/70">
          <span className="pill bg-white/75 border border-white/60 px-3 py-1 shadow-2xs">OpenWeatherMap Live Satellite</span>
          <span className="pill bg-white/75 border border-white/60 px-3 py-1 shadow-2xs">RainViewer HD Radar</span>
          <span className="pill bg-white/75 border border-white/60 px-3 py-1 shadow-2xs">Auto-synchronized</span>
        </div>
      </div>
    </div>
  );
};
