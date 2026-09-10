import React, { useState } from 'react';
import { WeatherAlert } from '../types';
import { getAlertId } from '../utils/weather';
import {
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  Sun,
  Flame,
  Snowflake,
  CloudLightning,
  Wind,
  CloudRain,
  Eye,
  X
} from 'lucide-react';

interface AlertsProps {
  alerts: WeatherAlert[];
}

const DISMISSED_ALERTS_SESSION_KEY = 'mellow_dismissed_weather_alerts';

function loadDismissedAlertIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(DISMISSED_ALERTS_SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDismissedAlertIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(DISMISSED_ALERTS_SESSION_KEY, JSON.stringify(ids));
  } catch (err) {
    console.warn('Failed to save dismissed alerts to sessionStorage', err);
  }
}

export const Alerts: React.FC<AlertsProps> = ({ alerts }) => {
  const [expandedIndices, setExpandedIndices] = useState<Record<string, boolean>>({});
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => loadDismissedAlertIds());

  const toggleAlert = (id: string) => {
    setExpandedIndices(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDismissAlert = (e: React.MouseEvent, alert: WeatherAlert) => {
    e.stopPropagation();
    const id = getAlertId(alert);
    setDismissedIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      saveDismissedAlertIds(updated);
      return updated;
    });
  };

  const handleDismissAll = () => {
    const allIds = alerts.map(getAlertId);
    setDismissedIds(prev => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      saveDismissedAlertIds(updated);
      return updated;
    });
  };

  const handleRestoreAlerts = () => {
    setDismissedIds([]);
    try {
      sessionStorage.removeItem(DISMISSED_ALERTS_SESSION_KEY);
    } catch {}
  };

  // Helper to pick a crisp Lucide icon based on title/category
  const getAlertIcon = (title: string, sev: string) => {
    const t = title.toLowerCase();
    if (t.includes('uv') || t.includes('sun')) {
      return <Sun size={20} className="text-[#D97706]" />;
    }
    if (t.includes('heat') || t.includes('hot')) {
      return <Flame size={20} className="text-[#DC2626]" />;
    }
    if (t.includes('cold') || t.includes('freeze') || t.includes('frost')) {
      return <Snowflake size={20} className="text-[#2563EB]" />;
    }
    if (t.includes('thunder') || t.includes('lightning') || t.includes('storm')) {
      return <CloudLightning size={20} className="text-[#7C3AED]" />;
    }
    if (t.includes('wind') || t.includes('gale')) {
      return <Wind size={20} className="text-[#0284C7]" />;
    }
    if (t.includes('rain') || t.includes('flood')) {
      return <CloudRain size={20} className="text-[#0284C7]" />;
    }
    if (t.includes('fog') || t.includes('visibility')) {
      return <Eye size={20} className="text-[#475569]" />;
    }
    return <AlertTriangle size={20} className={sev === 'extreme' ? 'text-[#DC2626]' : 'text-[#D97706]'} />;
  };

  // Sort: extreme > severe > moderate
  const severityOrder = { extreme: 0, severe: 1, moderate: 2 };
  const sortedAlerts = [...alerts].sort((a, b) => severityOrder[a.sev] - severityOrder[b.sev]);
  const visibleAlerts = sortedAlerts.filter(a => !dismissedIds.includes(getAlertId(a)));

  // If there are no alerts at all for this location
  if (alerts.length === 0) {
    return (
      <div id="alerts-banner" className="card px-5 py-3.5 flex items-center gap-3 !bg-[#F2FAF4] border border-[#CDE9D5] mt-4 shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-white border border-[#CDE9D5] flex items-center justify-center text-[#1E6941] shadow-2xs">
          <ShieldCheck size={20} />
        </div>
        <div className="text-[13.5px] font-bold text-[#1E6941]">
          All clear — no severe weather advisories or active warnings for this location.
        </div>
        <div className="ml-auto chip text-[#1E6941]/80 hidden sm:flex items-center gap-1.5">
          <span>Monitored</span>
        </div>
      </div>
    );
  }

  // If there were alerts, but all have been dismissed in this session
  if (visibleAlerts.length === 0) {
    return (
      <div id="alerts-banner-dismissed" className="card px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 !bg-[#F2FAF4] border border-[#CDE9D5] mt-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#CDE9D5] flex items-center justify-center text-[#1E6941] shadow-2xs">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-[13.5px] font-bold text-[#1E6941]">
              Weather advisories dismissed for this session.
            </div>
            <div className="text-[11.5px] font-semibold text-[#1E6941]/75">
              Saved in sessionStorage — alerts remain hidden during this browser session.
            </div>
          </div>
        </div>
        <button
          id="restore-alerts-btn"
          type="button"
          onClick={handleRestoreAlerts}
          className="pill bg-white border border-[#CDE9D5] px-3.5 py-1.5 text-[12px] font-bold text-[#1E6941] hover:bg-[#E2F5E9] transition shadow-2xs active:scale-95 cursor-pointer"
        >
          Restore alerts ({alerts.length})
        </button>
      </div>
    );
  }

  return (
    <div id="weather-alerts-banner" className="mt-4 space-y-2.5">
      {visibleAlerts.length > 1 && (
        <div className="flex items-center justify-between px-1 text-[12.5px] font-bold text-ink/75">
          <span className="flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-amber-600" />
            <span>{visibleAlerts.length} active weather advisories</span>
          </span>
          <button
            id="dismiss-all-alerts-btn"
            type="button"
            onClick={handleDismissAll}
            className="text-[12px] font-bold text-muted hover:text-ink underline hover:no-underline transition cursor-pointer"
          >
            Dismiss all
          </button>
        </div>
      )}

      {visibleAlerts.map((alert, idx) => {
        const alertId = getAlertId(alert);
        const isExpanded = !!expandedIndices[alertId];

        const cardTheme =
          alert.sev === 'extreme'
            ? 'bg-[#FFF2F4] border-[#FAC7CE] text-ink hover:border-[#F2A2AE]'
            : alert.sev === 'severe'
            ? 'bg-[#FFF7ED] border-[#FBD6B0] text-ink hover:border-[#F9BD80]'
            : 'bg-[#FFFBEB] border-[#F7E4A8] text-ink hover:border-[#EFD172]';

        const badgeTheme =
          alert.sev === 'extreme'
            ? 'bg-[#DC2626] text-white'
            : alert.sev === 'severe'
            ? 'bg-[#EA580C] text-white'
            : 'bg-[#D97706] text-white';

        return (
          <div
            id={`weather-alert-${idx}`}
            key={alertId}
            onClick={() => toggleAlert(alertId)}
            className={`card ${cardTheme} border px-5 py-3.5 cursor-pointer transition select-none shadow-xs`}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white/95 border border-black/5 flex items-center justify-center shrink-0 shadow-2xs">
                {getAlertIcon(alert.title, alert.sev)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`pill ${badgeTheme} px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase`}>
                    {alert.sev}
                  </span>
                  <span className="font-display font-bold text-[16px] text-ink">{alert.title}</span>
                </div>

                <div
                  className={`text-[13.5px] font-semibold text-ink/85 mt-1 leading-relaxed transition-all duration-300 ${
                    isExpanded ? 'block' : 'line-clamp-2'
                  }`}
                >
                  {alert.desc}
                  {alert.inst && isExpanded && (
                    <div className="mt-2.5 text-[12.5px] font-bold text-ink bg-white/80 p-3 rounded-2xl border border-black/5 shadow-2xs">
                      Safety advice: {alert.inst}
                    </div>
                  )}
                </div>

                {alert.area && (
                  <div className="text-[12px] font-bold text-ink/65 mt-1.5 flex items-center gap-1">
                    <span>📍 Affected area:</span>
                    <span>{alert.area}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                <button
                  id={`dismiss-alert-btn-${idx}`}
                  type="button"
                  onClick={(e) => handleDismissAlert(e, alert)}
                  className="pill bg-white/95 hover:bg-white border border-black/10 text-ink/80 hover:text-ink text-[12px] font-bold px-3 py-1.5 flex items-center gap-1.5 transition shadow-2xs active:scale-95 cursor-pointer"
                  title="Dismiss this alert for this session"
                  aria-label={`Dismiss ${alert.title}`}
                >
                  <X size={14} strokeWidth={2.5} />
                  <span>Dismiss</span>
                </button>

                <div
                  className="w-8 h-8 rounded-full bg-white/70 border border-black/5 flex items-center justify-center cursor-pointer hover:bg-white transition"
                  title={isExpanded ? "Collapse details" : "Expand details"}
                >
                  <ChevronDown
                    size={17}
                    className={`text-ink/60 font-black transition-transform duration-300 ${
                      isExpanded ? 'rotate-180 text-ink' : ''
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
