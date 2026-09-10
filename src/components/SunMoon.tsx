import React from 'react';
import { WeatherData } from '../types';
import { fmtClock, fmtDur, moonPhase } from '../utils/weather';
import { Sunrise, Sunset, Sun, Moon, Sparkles } from 'lucide-react';

interface SunMoonProps {
  weather: WeatherData;
  tzOffsetSec: number;
}

export const SunMoon: React.FC<SunMoonProps> = ({ weather, tzOffsetSec }) => {
  const d = weather.daily;
  const sr = d.sunrise[0];
  const ss = d.sunset[0];
  const daylightSec = d.daylight_duration[0];

  // Calculate sun position on the arc
  const realNow = new Date();
  const tn = Date.now() + tzOffsetSec * 1000;
  const t0 = new Date(sr).getTime();
  const t1 = new Date(ss).getTime();

  let frac = (tn - t0) / (t1 - t0);
  frac = Math.max(0, Math.min(1, frac));
  const isDay = frac > 0 && frac < 1 && tn > t0 && tn < t1;

  const ang = Math.PI * frac;
  const sunX = 100 - 86 * Math.cos(ang);
  const sunY = 88 - 80 * Math.sin(ang);
  const arcDashOffset = 271 - 271 * (isDay ? frac : tn > t1 ? 1 : 0);

  // Calculate moon phase
  const mp = moonPhase(realNow);

  return (
    <div id="sun-moon-card" className="card card-hover p-6 sm:p-7 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-[19px] text-ink">Sun & moon</h3>
          <span className="pill bg-[#E6EFF7] text-[#1E5C88] border border-[#CCE0F2] px-3 py-1 text-[11px] font-black shadow-2xs">
            DAYLIGHT {fmtDur(daylightSec)}
          </span>
        </div>

        {/* Sunrise & Sunset Boxes */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-2xl bg-[#FFF3E3] border border-[#FADBB6] p-3.5 text-center shadow-2xs">
            <Sunrise size={22} className="text-[#A55E1A] mx-auto" />
            <div className="text-[11px] font-black tracking-wider text-[#9E5114] mt-1.5">SUNRISE</div>
            <div className="font-display font-bold text-[18px] text-ink mt-0.5">{fmtClock(sr)}</div>
          </div>
          <div className="rounded-2xl bg-[#F0ECFA] border border-[#DDD4F3] p-3.5 text-center shadow-2xs">
            <Sunset size={22} className="text-[#6450A3] mx-auto" />
            <div className="text-[11px] font-black tracking-wider text-[#5B4897] mt-1.5">SUNSET</div>
            <div className="font-display font-bold text-[18px] text-ink mt-0.5">{fmtClock(ss)}</div>
          </div>
        </div>

        {/* Animated Sun Arc SVG */}
        <div className="mt-4 relative">
          <svg viewBox="0 0 200 104" className="w-full">
            <defs>
              <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FFD6A0" />
                <stop offset="50%" stopColor="#FFD66B" />
                <stop offset="100%" stopColor="#E8A9A9" />
              </linearGradient>
            </defs>
            <line
              x1="6"
              y1="88"
              x2="194"
              y2="88"
              stroke="#EAE5DF"
              strokeWidth="2"
              strokeDasharray="5 5"
              strokeLinecap="round"
            />
            <path
              d="M14 88 A86 86 0 0 1 186 88"
              fill="none"
              stroke="#F2EDE7"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M14 88 A86 86 0 0 1 186 88"
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="271"
              strokeDashoffset={arcDashOffset}
            />
            <g
              transform={`translate(${sunX} ${isDay ? sunY : 88})`}
              style={{ transition: "all 0.8s ease-out", opacity: isDay ? 1 : 0.3 }}
            >
              <circle r="11" fill="#FFD66B" stroke="#fff" strokeWidth="3" />
              <circle r="15" fill="#FFD66B" opacity="0.25" />
            </g>
          </svg>
          <div className="flex items-center justify-center gap-1.5 text-center text-[12.5px] font-bold text-muted -mt-1">
            {isDay ? (
              <>
                <Sun size={14} className="text-amber-500" />
                <span>Sun {(frac * 100).toFixed(0)}% across daylight sky</span>
              </>
            ) : tn < t0 ? (
              <>
                <Moon size={14} className="text-[#6450A3]" />
                <span>Nighttime — awaiting next sunrise</span>
              </>
            ) : (
              <>
                <Moon size={14} className="text-[#6450A3]" />
                <span>Nighttime — sun has set</span>
              </>
            )}
          </div>
        </div>

        <div className="my-4 h-px bg-line/80"></div>

        {/* Moon Phase Section */}
        <div className="flex items-center gap-4">
          <div className="moon shrink-0 border border-line shadow-2xs">
            <div
              className="moon-shadow"
              style={{
                width: `${(1 - mp.illum) * 100}%`,
                left: mp.idx >= 4 ? 0 : 'auto',
                right: mp.idx < 4 ? 0 : 'auto',
                borderRadius: mp.idx < 4 ? '99px 0 0 99px' : '0 99px 99px 0'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[12px] text-ink/70">
              <Moon size={16} className="text-slate-600" />
            </div>
          </div>
          <div className="flex-1">
            <div className="font-display font-bold text-[16px] text-ink">
              {mp.name}
            </div>
            <div className="text-[12.5px] font-bold text-muted">
              Illumination {(mp.illum * 100).toFixed(0)}% · Age {mp.age.toFixed(1)} days
            </div>
            <div className="meter-track mt-2 bg-[#EAE5DF]">
              <div
                className="meter-fill bg-gradient-to-r from-[#BDB0E3] to-[#7561B8]"
                style={{ width: `${mp.illum * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Golden Hour Note */}
      <div className="mt-4 rounded-2xl bg-[#EAF7EE] border border-[#BDE7CB] p-3 text-[12.5px] font-bold text-[#1B633D] leading-snug shadow-2xs flex items-start gap-2">
        <Sparkles size={16} className="shrink-0 mt-0.5 text-[#1B633D]" />
        <div>
          {isDay
            ? frac > 0.75
              ? "Golden hour glow — soft warm light ideal for outdoor photography."
              : frac < 0.15
              ? "Early morning light — crisp fresh air and quiet streetscapes."
              : "Midday brightness — UV protection and polarized sunglasses recommended."
            : "Night sky view — check stargazing suitability in the Health & Lifestyle panel."}
        </div>
      </div>
    </div>
  );
};
