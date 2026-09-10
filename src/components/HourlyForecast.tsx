import React, { useState, useEffect, useRef } from 'react';
import { WeatherData } from '../types';
import { WeatherIcon } from './WeatherIcon';
import { fmtTemp, fmtTempNum, fmtHour, fmtClock, fmtDayShort, fmtWind, fmtVis, wmoLabel, degToCompass } from '../utils/weather';
import { Chart, registerables } from 'chart.js';
import { CloudRain, Clock } from 'lucide-react';

Chart.register(...registerables);

interface HourlyForecastProps {
  weather: WeatherData;
  unit: 'C' | 'F';
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({ weather, unit }) => {
  const [horizon, setHorizon] = useState<8 | 16>(8); // 8 steps (24h) or 16 steps (48h)
  const [selectedHourIdx, setSelectedHourIdx] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const h = weather.hourly;
  const count = Math.min(horizon, h.time.length);
  const times = h.time.slice(0, count);
  const temps = h.temperature_2m.slice(0, count);
  const probs = h.precipitation_probability.slice(0, count);
  const codes = h.weather_code.slice(0, count);
  const days = h.is_day.slice(0, count);
  const winds = h.wind_speed_10m.slice(0, count);

  // Render Chart.js
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const grad = ctx.createLinearGradient(0, 0, 0, 180);
    grad.addColorStop(0, "rgba(233, 169, 63, 0.35)");
    grad.addColorStop(1, "rgba(233, 169, 63, 0.0)");

    Chart.defaults.font.family = "Nunito, sans-serif";
    Chart.defaults.font.weight = "bold";

    const newChart = new Chart(ctx, {
      data: {
        labels: times.map(t => fmtHour(t)),
        datasets: [
          {
            type: 'line',
            label: 'Temperature',
            data: temps.map(t => fmtTempNum(t, unit) as number),
            borderColor: '#E9A93F',
            backgroundColor: grad,
            fill: true,
            tension: 0.42,
            borderWidth: 3,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#FFFFFF',
            pointBorderColor: '#E9A93F',
            yAxisID: 'y'
          },
          {
            type: 'bar',
            label: 'Rain %',
            data: probs,
            backgroundColor: 'rgba(122, 160, 196, 0.45)',
            hoverBackgroundColor: 'rgba(122, 160, 196, 0.8)',
            borderRadius: 6,
            barPercentage: 0.5,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#4B4B5E',
            padding: 12,
            cornerRadius: 14,
            titleFont: { family: 'Quicksand, sans-serif', size: 13 },
            callbacks: {
              label: (context) => {
                if (context.dataset.label === 'Temperature') {
                  return ` Temperature: ${context.parsed.y}°${unit}`;
                }
                return ` Rain probability: ${context.parsed.y}%`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: horizon > 8 ? 8 : 6,
              font: { size: 11 },
              color: '#8E8EA3'
            }
          },
          y: {
            position: 'left',
            grid: { color: '#F1EDE8' },
            ticks: {
              font: { size: 11 },
              color: '#8E8EA3',
              callback: (val) => `${val}°`
            }
          },
          y1: {
            position: 'right',
            min: 0,
            max: 100,
            grid: { display: false },
            ticks: {
              font: { size: 10 },
              color: '#7AA0C4',
              callback: (val) => `${val}%`
            }
          }
        }
      }
    });

    chartInstanceRef.current = newChart;

    return () => {
      newChart.destroy();
    };
  }, [times, temps, probs, unit, horizon]);

  const selectedHour = selectedHourIdx !== null ? {
    time: h.time[selectedHourIdx],
    desc: h.description[selectedHourIdx] || wmoLabel(codes[selectedHourIdx]),
    feels: h.apparent_temperature[selectedHourIdx],
    humidity: h.relative_humidity_2m[selectedHourIdx],
    dew: h.dew_point_2m[selectedHourIdx],
    wind: h.wind_speed_10m[selectedHourIdx],
    windDir: h.wind_direction_10m[selectedHourIdx],
    gusts: h.wind_gusts_10m[selectedHourIdx],
    uv: h.uv_index[selectedHourIdx],
    vis: h.visibility[selectedHourIdx],
    clouds: h.cloud_cover[selectedHourIdx]
  } : null;

  return (
    <section id="hourly-forecast-section" className="card card-hover p-6 sm:p-7 mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-[20px] text-ink">Hourly forecast</h2>
          <p className="text-[13px] font-bold text-muted mt-0.5">
            3-hour precision timeline · tap any block below to inspect details
          </p>
        </div>

        {/* 24h vs 48h Toggle */}
        <div className="seg shadow-2xs">
          <button
            onClick={() => setHorizon(8)}
            className={`seg-btn ${horizon === 8 ? 'active' : ''}`}
          >
            Next 24h
          </button>
          <button
            onClick={() => setHorizon(16)}
            className={`seg-btn ${horizon === 16 ? 'active' : ''}`}
          >
            48h
          </button>
        </div>
      </div>

      {/* Chart legend / labels */}
      <div className="flex items-center gap-4 mt-3 text-[12px] font-bold text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#E9A93F] inline-block"></span>
          Temperature curve
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#1E5C88] inline-block"></span>
          Precipitation chance
        </span>
        <span className="ml-auto font-extrabold text-ink/70">
          ~{count * 3}h timeline
        </span>
      </div>

      {/* Chart Canvas */}
      <div className="h-[190px] mt-2">
        <canvas ref={canvasRef} />
      </div>

      {/* Horizontal Scroll Strip */}
      <div className="flex gap-3 overflow-x-auto thin-scroll pb-2 pt-3" style={{ scrollSnapType: 'x mandatory' }}>
        {times.map((t, i) => {
          const isSelected = selectedHourIdx === i;
          const isNow = i === 0;

          return (
            <div
              key={`${t}-${i}`}
              onClick={() => setSelectedHourIdx(isSelected ? null : i)}
              className={`hour-card shrink-0 rounded-2xl border p-3 text-center transition cursor-pointer ${
                isNow
                  ? 'now bg-ink text-white border-transparent shadow-card'
                  : isSelected
                  ? 'bg-butter border-[#EADB9E] shadow-sm'
                  : 'bg-white border-line hover:border-sky-dark/40 shadow-2xs'
              }`}
            >
              <div className={`text-[11px] font-black tracking-wider ${isNow ? 'text-white/80' : 'text-muted'}`}>
                {isNow ? "NOW" : fmtHour(t).replace(" ", "")}
              </div>

              <div className="flex justify-center my-1.5">
                <WeatherIcon
                  code={codes[i]}
                  isDay={days[i] === 1}
                  size={34}
                />
              </div>

              <div className={`font-display font-bold text-[15.5px] ${isNow ? 'text-white' : 'text-ink'}`}>
                {fmtTemp(temps[i], unit)}
              </div>

              <div className={`text-[11.5px] font-extrabold mt-1 flex items-center justify-center gap-0.5 ${isNow ? 'text-sky-200' : 'text-[#1E5C88]'}`}>
                <CloudRain size={11} />
                <span>{probs[i] ?? 0}%</span>
              </div>

              <div className={`text-[10.5px] font-bold ${isNow ? 'text-white/70' : 'text-muted'}`}>
                {fmtWind(winds[i], unit)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Hour Detail Banner */}
      {selectedHour && (
        <div className="mt-3.5 rounded-2xl bg-white border border-line p-4 text-[13px] font-bold text-ink shadow-2xs">
          <div className="flex items-center gap-2 font-display font-bold text-[14.5px] text-ink mb-1">
            <Clock size={16} className="text-[#1D6C9F]" />
            <span>{fmtDayShort(selectedHour.time)} {fmtClock(selectedHour.time)}</span>
            <span className="text-muted text-[13px] font-semibold">· {selectedHour.desc}</span>
          </div>
          <div className="text-[12.5px] text-ink/80 flex flex-wrap gap-x-3 gap-y-1 mt-1 font-semibold">
            <span>Feels {fmtTemp(selectedHour.feels, unit)}</span>
            <span>• Humidity {selectedHour.humidity}%</span>
            <span>• Dew {fmtTemp(selectedHour.dew, unit)}</span>
            <span>• Wind {fmtWind(selectedHour.wind, unit)} ({degToCompass(selectedHour.windDir)})</span>
            <span>• Gusts {fmtWind(selectedHour.gusts, unit)}</span>
            <span>• UV {selectedHour.uv != null ? selectedHour.uv.toFixed(1) : "N/A"}</span>
            <span>• Visibility {fmtVis(selectedHour.vis, unit)}</span>
            <span>• Clouds {selectedHour.clouds}%</span>
          </div>
        </div>
      )}
    </section>
  );
};
