import React, { useState } from 'react';
import { WeatherData } from '../types';
import { WeatherIcon } from './WeatherIcon';
import { fmtTemp, fmtDayShort, fmtDayFull, fmtClock, fmtDur, fmtWind, fmtPrec, degToCompass } from '../utils/weather';
import { ChevronDown, Sunrise, Sunset, SunMedium, Wind, Gauge, CloudRain } from 'lucide-react';

interface DailyForecastProps {
  weather: WeatherData;
  unit: 'C' | 'F';
}

export const DailyForecast: React.FC<DailyForecastProps> = ({ weather, unit }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const d = weather.daily;
  const allTemps = [...d.temperature_2m_max, ...d.temperature_2m_min];
  const gmin = Math.min(...allTemps);
  const gmax = Math.max(...allTemps);
  const span = gmax - gmin || 1;

  const getGradient = (t: number) => {
    if (t >= 30) return 'linear-gradient(90deg,#FFC98A,#FF8E7A)';
    if (t >= 20) return 'linear-gradient(90deg,#FFE9A8,#FFC98A)';
    if (t >= 10) return 'linear-gradient(90deg,#BFE3D0,#FFE9A8)';
    return 'linear-gradient(90deg,#A8C8E8,#BFE3D0)';
  };

  const toggleDay = (i: number) => {
    setOpenIndex(prev => (prev === i ? null : i));
  };

  return (
    <div id="daily-forecast-card" className="card card-hover p-6 sm:p-7 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-[20px] text-ink">5-day outlook</h2>
          <span className="pill bg-[#E6EFF7] text-[#1E5C88] border border-[#CCE0F2] px-3 py-1 text-[11px] font-black shadow-2xs">
            5-DAY
          </span>
        </div>
        <p className="text-[13px] font-bold text-muted mt-0.5">
          Tap any day to see wind, sunrise, sunset & UV index
        </p>

        <div className="mt-3.5 divide-y divide-line">
          {d.time.map((t, i) => {
            const isOpen = openIndex === i;
            const left = ((d.temperature_2m_min[i] - gmin) / span * 100).toFixed(1);
            const width = Math.max(8, ((d.temperature_2m_max[i] - d.temperature_2m_min[i]) / span * 100)).toFixed(1);
            const midTemp = (d.temperature_2m_max[i] + d.temperature_2m_min[i]) / 2;

            return (
              <div key={`${t}-${i}`} className="py-3">
                <div
                  onClick={() => toggleDay(i)}
                  className="flex items-center gap-3 cursor-pointer select-none rounded-xl hover:bg-neutral-light p-2 -mx-2 transition"
                >
                  <div className="w-[84px] shrink-0">
                    <div className="font-display font-bold text-[14.5px] text-ink">
                      {i === 0 ? "Today" : fmtDayShort(t)}
                    </div>
                    <div className="text-[11.5px] font-bold text-muted">
                      {new Date(t + "T12:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <WeatherIcon
                      code={d.weather_code[i]}
                      isDay={true}
                      size={32}
                    />
                  </div>

                  <div className="w-12 text-[12px] font-extrabold text-[#1E5C88] flex items-center gap-0.5">
                    <CloudRain size={12} />
                    <span>{d.precipitation_probability_max[i] ?? 0}%</span>
                  </div>

                  <div className="w-10 text-right font-display font-bold text-[14px] text-muted">
                    {fmtTemp(d.temperature_2m_min[i], unit)}
                  </div>

                  <div className="flex-1 tempbar-track bg-[#EAE5DF]">
                    <div
                      className="tempbar-fill"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        background: getGradient(midTemp)
                      }}
                    />
                  </div>

                  <div className="w-10 text-right font-display font-bold text-[14.5px] text-ink">
                    {fmtTemp(d.temperature_2m_max[i], unit)}
                  </div>

                  <ChevronDown
                    size={16}
                    className={`text-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-ink' : ''}`}
                  />
                </div>

                {/* Expanded day details */}
                {isOpen && (
                  <div className="pt-3 px-1 pb-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[12.5px] font-bold">
                      <div className="rounded-xl bg-white border border-line p-3 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-ink">
                          <Sunrise size={15} className="text-[#A55E1A]" />
                          <span>{i === 0 ? "" : "≈ "}{fmtClock(d.sunrise[i])}</span>
                        </div>
                        <span className="text-muted font-bold text-[11px] block mt-0.5">Sunrise</span>
                      </div>
                      <div className="rounded-xl bg-white border border-line p-3 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-ink">
                          <Sunset size={15} className="text-[#6450A3]" />
                          <span>{i === 0 ? "" : "≈ "}{fmtClock(d.sunset[i])}</span>
                        </div>
                        <span className="text-muted font-bold text-[11px] block mt-0.5">Sunset</span>
                      </div>
                      <div className="rounded-xl bg-white border border-line p-3 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-ink">
                          <SunMedium size={15} className="text-[#8C5D08]" />
                          <span>UV {d.uv_index_max[i] != null ? d.uv_index_max[i]?.toFixed(0) : "N/A"}</span>
                        </div>
                        <span className="text-muted font-bold text-[11px] block mt-0.5">Max UV index</span>
                      </div>
                      <div className="rounded-xl bg-white border border-line p-3 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-ink">
                          <Wind size={15} className="text-[#1D6C9F]" />
                          <span>{fmtWind(d.wind_speed_10m_max[i], unit)}</span>
                        </div>
                        <span className="text-muted font-bold text-[11px] block mt-0.5">
                          Max wind {degToCompass(d.wind_direction_10m_dominant[i] || 0)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-white border border-line p-3 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-ink">
                          <Gauge size={15} className="text-[#87650C]" />
                          <span>{fmtWind(d.wind_gusts_10m_max[i], unit)}</span>
                        </div>
                        <span className="text-muted font-bold text-[11px] block mt-0.5">Peak gusts</span>
                      </div>
                      <div className="rounded-xl bg-white border border-line p-3 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-ink">
                          <CloudRain size={15} className="text-[#1E5C88]" />
                          <span>{fmtPrec(d.precipitation_sum[i] || 0, unit)}</span>
                        </div>
                        <span className="text-muted font-bold text-[11px] block mt-0.5">
                          {d.daylight_duration[i] ? `${fmtDur(d.daylight_duration[i])} daylight` : "Rain total"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-[12px] font-bold text-muted">
                      {d.description[i]} · {fmtDayFull(t)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
