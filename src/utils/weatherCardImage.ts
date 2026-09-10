import { PlaceLocation, WeatherData } from '../types';
import {
  fmtTemp,
  fmtTempNum,
  fmtWind,
  fmtVis,
  fmtPrec,
  calcDewPoint,
  degToCompass,
  nowLocal,
  offsetLabel
} from './weather';

export interface WeatherSummaryCardOptions {
  location: PlaceLocation;
  weather: WeatherData;
  unit: 'C' | 'F';
  tzOffsetSec: number;
}

/**
 * Draws a rounded rectangle path on Canvas.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Generates a beautiful card image of the current weather data as a PNG Blob.
 */
export async function generateWeatherCardBlob({
  location,
  weather,
  unit,
  tzOffsetSec
}: WeatherSummaryCardOptions): Promise<Blob> {
  const width = 1200;
  const height = 760;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Ensure fonts have had a moment to resolve if available
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  const toTemp = (val: number | null | undefined): number => {
    if (val == null || isNaN(val)) return 0;
    return unit === 'C' ? Math.round(val) : Math.round((val * 9) / 5 + 32);
  };

  const c = weather.current;
  const isDay = c.is_day === 1;
  const tempVal = toTemp(c.temperature_2m);
  const feelsLikeVal = toTemp(c.apparent_temperature);
  const hiVal = toTemp(weather.daily.temperature_2m_max[0]);
  const loVal = toTemp(weather.daily.temperature_2m_min[0]);
  const precipProb = weather.daily.precipitation_probability_max[0] ?? 0;
  const precipSum = fmtPrec(weather.daily.precipitation_sum?.[0] ?? c.precipitation, unit);
  const dewVal = toTemp(calcDewPoint(c.temperature_2m, c.relative_humidity_2m));
  const windStr = fmtWind(c.wind_speed_10m, unit);
  const gustStr = fmtWind(c.wind_gusts_10m, unit);
  const compass = degToCompass(c.wind_direction_10m);
  const visStr = fmtVis(c.visibility, unit);
  const uvVal = c.uv_index != null ? c.uv_index.toFixed(1) : '—';
  const scaleName = unit === 'C' ? 'Celsius' : 'Fahrenheit';

  // Format local date
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const localDate = new Date(utc + tzOffsetSec * 1000);
  const dateFormatted = localDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const timeFormatted = nowLocal(tzOffsetSec);
  const offsetStr = offsetLabel(tzOffsetSec);

  // 1. Transparent canvas base + shadow padding
  ctx.clearRect(0, 0, width, height);

  // 2. Draw card container with rounded corners
  const cardX = 20;
  const cardY = 20;
  const cardW = width - 40;
  const cardH = height - 40;
  const cardRadius = 38;

  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.clip();

  // Background gradient: Elegant warm cream to subtle pastel sky
  const bgGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  if (isDay) {
    bgGrad.addColorStop(0, '#FFFFFF');
    bgGrad.addColorStop(0.5, '#FFFDF6');
    bgGrad.addColorStop(1, '#FFF9E6');
  } else {
    bgGrad.addColorStop(0, '#1E2235');
    bgGrad.addColorStop(0.6, '#181B2B');
    bgGrad.addColorStop(1, '#111320');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(cardX, cardY, cardW, cardH);

  // Radial sunshine / ambient glow in top-right
  if (isDay) {
    const sunGlow = ctx.createRadialGradient(cardX + cardW - 180, cardY + 160, 40, cardX + cardW - 180, cardY + 160, 360);
    sunGlow.addColorStop(0, 'rgba(255, 238, 160, 0.6)');
    sunGlow.addColorStop(0.5, 'rgba(255, 247, 177, 0.25)');
    sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // Warm radial flare in bottom-left
    const warmFlare = ctx.createRadialGradient(cardX + 160, cardY + cardH - 120, 10, cardX + 160, cardY + cardH - 120, 260);
    warmFlare.addColorStop(0, 'rgba(255, 247, 177, 0.35)');
    warmFlare.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = warmFlare;
    ctx.fillRect(cardX, cardY, cardW, cardH);
  } else {
    const moonGlow = ctx.createRadialGradient(cardX + cardW - 180, cardY + 160, 30, cardX + cardW - 180, cardY + 160, 300);
    moonGlow.addColorStop(0, 'rgba(170, 190, 255, 0.3)');
    moonGlow.addColorStop(1, 'rgba(24, 27, 43, 0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(cardX, cardY, cardW, cardH);
  }

  // Draw Card Inner Border
  ctx.strokeStyle = isDay ? '#EFE9DD' : 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.stroke();

  // -------------------------------------------------------------
  // 3. TOP HEADER ROW
  // -------------------------------------------------------------
  const headerY = cardY + 54;

  // Badge: "DAILY WEATHER SUMMARY"
  const badgeX = cardX + 50;
  const badgeY = headerY - 26;
  const badgeW = 245;
  const badgeH = 36;
  const badgeRadius = 18;

  ctx.fillStyle = isDay ? '#FFF5D6' : 'rgba(255, 255, 255, 0.1)';
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeRadius);
  ctx.fill();
  ctx.strokeStyle = isDay ? '#EADB9E' : 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = isDay ? '#925C05' : '#E2E8F0';
  ctx.font = 'bold 13px "Quicksand", "Nunito", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('☀️ DAILY WEATHER SUMMARY', badgeX + badgeW / 2, badgeY + 23);

  // Date and Local Time (Right side)
  ctx.textAlign = 'right';
  ctx.fillStyle = isDay ? '#6C6C7E' : '#94A3B8';
  ctx.font = 'bold 16px "Nunito", sans-serif';
  ctx.fillText(`${dateFormatted} · ${timeFormatted} (${offsetStr})`, cardX + cardW - 50, headerY - 2);

  // Subtle separator line
  ctx.beginPath();
  ctx.moveTo(cardX + 50, headerY + 28);
  ctx.lineTo(cardX + cardW - 50, headerY + 28);
  ctx.strokeStyle = isDay ? '#EFEBE2' : 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // -------------------------------------------------------------
  // 4. MAIN WEATHER HERO SECTION
  // -------------------------------------------------------------
  const mainY = headerY + 68;

  // City Name
  ctx.textAlign = 'left';
  ctx.fillStyle = isDay ? '#2D2D3A' : '#F8FAFC';
  ctx.font = 'bold 44px "Quicksand", "Nunito", sans-serif';
  ctx.fillText(location.name, cardX + 50, mainY + 36);

  // Region, Country & Coordinates
  const locDetail = [location.admin, location.country].filter(Boolean).join(', ');
  const coordStr = `${Math.abs(location.lat).toFixed(2)}°${location.lat >= 0 ? 'N' : 'S'}, ${Math.abs(location.lon).toFixed(2)}°${location.lon >= 0 ? 'E' : 'W'}`;
  ctx.fillStyle = isDay ? '#717182' : '#94A3B8';
  ctx.font = 'bold 18px "Nunito", sans-serif';
  ctx.fillText(`${locDetail} • ${coordStr}`, cardX + 50, mainY + 70);

  // Condition Badge (Pill)
  const condText = c.description.toUpperCase();
  ctx.font = 'bold 14px "Quicksand", "Nunito", sans-serif';
  const condWidth = Math.max(130, ctx.measureText(condText).width + 36);
  const condX = cardX + 50;
  const condY = mainY + 95;
  const condH = 34;

  ctx.fillStyle = isDay ? '#E8F5E9' : 'rgba(76, 155, 235, 0.2)';
  drawRoundedRect(ctx, condX, condY, condWidth, condH, 17);
  ctx.fill();
  ctx.strokeStyle = isDay ? '#C8E6C9' : 'rgba(76, 155, 235, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = isDay ? '#2E7D32' : '#90CAF9';
  ctx.textAlign = 'center';
  ctx.fillText(condText, condX + condWidth / 2, condY + 22);

  // Giant Temperature
  ctx.textAlign = 'left';
  ctx.fillStyle = isDay ? '#2D2D3A' : '#FFFFFF';
  ctx.font = 'bold 105px "Quicksand", "Nunito", sans-serif';
  ctx.fillText(`${tempVal}°`, cardX + 50, mainY + 235);

  // Unit Pill beside temperature
  const unitPillX = cardX + 50 + ctx.measureText(`${tempVal}°`).width + 16;
  const unitPillY = mainY + 165;
  const unitPillW = 88;
  const unitPillH = 34;
  ctx.fillStyle = isDay ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.12)';
  drawRoundedRect(ctx, unitPillX, unitPillY, unitPillW, unitPillH, 10);
  ctx.fill();
  ctx.fillStyle = isDay ? '#574D33' : '#CBD5E1';
  ctx.font = 'bold 14px "Nunito", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(scaleName, unitPillX + unitPillW / 2, unitPillY + 22);

  // Feels Like and Daily Range
  ctx.textAlign = 'left';
  ctx.fillStyle = isDay ? '#574D33' : '#E2E8F0';
  ctx.font = 'bold 20px "Nunito", sans-serif';
  ctx.fillText(
    `Feels like ${feelsLikeVal}°  •  High ${hiVal}° / Low ${loVal}°`,
    cardX + 50,
    mainY + 275
  );

  // -------------------------------------------------------------
  // 5. ARTISTIC WEATHER ILLUSTRATION (Right Side)
  // -------------------------------------------------------------
  const artCenterX = cardX + cardW - 200;
  const artCenterY = mainY + 130;

  if (isDay) {
    // Sunshine rays halo
    const sunGradHalo = ctx.createRadialGradient(artCenterX, artCenterY, 50, artCenterX, artCenterY, 150);
    sunGradHalo.addColorStop(0, 'rgba(252, 187, 4, 0.45)');
    sunGradHalo.addColorStop(1, 'rgba(255, 252, 0, 0)');
    ctx.fillStyle = sunGradHalo;
    ctx.beginPath();
    ctx.arc(artCenterX, artCenterY, 150, 0, Math.PI * 2);
    ctx.fill();

    // Golden Sun
    const sunGrad = ctx.createLinearGradient(artCenterX - 80, artCenterY, artCenterX + 80, artCenterY);
    sunGrad.addColorStop(0, '#FCBB04');
    sunGrad.addColorStop(1, '#FFFC00');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(artCenterX, artCenterY, 76, 0, Math.PI * 2);
    ctx.fill();

    // Back Cloud (Sky Blue)
    ctx.fillStyle = '#4C9BEB';
    ctx.beginPath();
    ctx.arc(artCenterX + 60, artCenterY + 10, 42, 0, Math.PI * 2);
    ctx.arc(artCenterX + 25, artCenterY + 20, 32, 0, Math.PI * 2);
    ctx.fill();

    // Front Cloud (Crisp Dimensional Blue)
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.arc(artCenterX - 45, artCenterY + 45, 54, 0, Math.PI * 2);
    ctx.arc(artCenterX + 5, artCenterY + 52, 42, 0, Math.PI * 2);
    ctx.arc(artCenterX - 85, artCenterY + 55, 36, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Night Moon & Stars
    const moonGrad = ctx.createRadialGradient(artCenterX, artCenterY, 20, artCenterX, artCenterY, 80);
    moonGrad.addColorStop(0, '#FFFFFF');
    moonGrad.addColorStop(0.8, '#E2E8F0');
    moonGrad.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(artCenterX, artCenterY, 70, 0, Math.PI * 2);
    ctx.fill();

    // Moon crater effect / inner shadow
    ctx.fillStyle = '#181B2B';
    ctx.beginPath();
    ctx.arc(artCenterX - 25, artCenterY - 15, 60, 0, Math.PI * 2);
    ctx.fill();

    // Night Cloud
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.beginPath();
    ctx.arc(artCenterX + 35, artCenterY + 35, 48, 0, Math.PI * 2);
    ctx.arc(artCenterX - 20, artCenterY + 42, 38, 0, Math.PI * 2);
    ctx.fill();
  }

  // -------------------------------------------------------------
  // 6. BOTTOM METRICS BAR (4 Distinct Metric Columns)
  // -------------------------------------------------------------
  const metricsY = cardY + cardH - 185;
  const metricsW = cardW - 100;
  const metricsH = 120;
  const metricsX = cardX + 50;
  const metricsRadius = 24;

  ctx.fillStyle = isDay ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)';
  drawRoundedRect(ctx, metricsX, metricsY, metricsW, metricsH, metricsRadius);
  ctx.fill();
  ctx.strokeStyle = isDay ? '#EFE8DC' : 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw 4 columns
  const colW = metricsW / 4;
  const metrics = [
    {
      label: 'PRECIPITATION',
      value: `${precipProb}%`,
      sub: `${precipSum} expected`
    },
    {
      label: 'WIND & GUSTS',
      value: windStr,
      sub: `From ${compass} · Gusts ${gustStr}`
    },
    {
      label: 'HUMIDITY',
      value: `${c.relative_humidity_2m}%`,
      sub: `Dew point ${dewVal}°`
    },
    {
      label: 'UV & VISIBILITY',
      value: `UV ${uvVal}`,
      sub: `Visibility ${visStr}`
    }
  ];

  metrics.forEach((m, idx) => {
    const colX = metricsX + idx * colW;

    // Vertical column divider
    if (idx > 0) {
      ctx.beginPath();
      ctx.moveTo(colX, metricsY + 18);
      ctx.lineTo(colX, metricsY + metricsH - 18);
      ctx.strokeStyle = isDay ? '#F0EAE0' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Label
    ctx.textAlign = 'center';
    ctx.fillStyle = isDay ? '#8A8A9E' : '#94A3B8';
    ctx.font = 'bold 12px "Quicksand", "Nunito", sans-serif';
    ctx.fillText(m.label, colX + colW / 2, metricsY + 34);

    // Primary Value
    ctx.fillStyle = isDay ? '#2D2D3A' : '#FFFFFF';
    ctx.font = 'bold 24px "Quicksand", "Nunito", sans-serif';
    ctx.fillText(m.value, colX + colW / 2, metricsY + 68);

    // Sub-text
    ctx.fillStyle = isDay ? '#6C6C7E' : '#CBD5E1';
    ctx.font = 'bold 13px "Nunito", sans-serif';
    ctx.fillText(m.sub, colX + colW / 2, metricsY + 95);
  });

  // -------------------------------------------------------------
  // 7. FOOTER WATERMARK
  // -------------------------------------------------------------
  ctx.textAlign = 'left';
  ctx.fillStyle = isDay ? '#9E9EA8' : '#64748B';
  ctx.font = 'bold 13px "Nunito", sans-serif';
  ctx.fillText('Mellow Weather · Real-time meteorological telemetry & atmospheric models', cardX + 54, cardY + cardH - 22);

  ctx.textAlign = 'right';
  ctx.fillText('Generated offline in-browser as PNG', cardX + cardW - 54, cardY + cardH - 22);

  ctx.restore();

  // -------------------------------------------------------------
  // 8. RESOLVE PNG BLOB
  // -------------------------------------------------------------
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate PNG blob from canvas'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

/**
 * Generates a beautiful card image of the current weather data
 * and triggers an automatic browser PNG download.
 */
export async function downloadWeatherSummaryCardImage(
  options: WeatherSummaryCardOptions
): Promise<void> {
  const blob = await generateWeatherCardBlob(options);
  const safeCity = options.location.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const safeDate = new Date().toISOString().slice(0, 10);
  const fileName = `weather-card_${safeCity}_${safeDate}.png`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Copies the generated weather card image (PNG) directly to the system clipboard.
 */
export async function copyWeatherCardImageToClipboard(
  options: WeatherSummaryCardOptions
): Promise<boolean> {
  try {
    const blob = await generateWeatherCardBlob(options);
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Clipboard image write not supported or permitted:', err);
    return false;
  }
}

/**
 * Shares the location card in PNG format via Web Share API (native file sharing),
 * or falls back gracefully to downloading the card PNG and copying the share link.
 */
export async function shareWeatherCardAsPng(
  options: WeatherSummaryCardOptions
): Promise<{ success: boolean; method: 'native-file' | 'native-url' | 'download' }> {
  const blob = await generateWeatherCardBlob(options);
  const safeCity = options.location.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fileName = `weather-card_${safeCity}.png`;
  const shareUrl = `${window.location.origin}${window.location.pathname}?lat=${options.location.lat.toFixed(4)}&lon=${options.location.lon.toFixed(4)}&name=${encodeURIComponent(options.location.name)}`;
  const title = `Weather in ${options.location.name}`;
  const text = `Current weather in ${options.location.name}: ${options.weather.current.description}, ${options.unit === 'C' ? Math.round(options.weather.current.temperature_2m) : Math.round((options.weather.current.temperature_2m * 9) / 5 + 32)}°${options.unit}`;

  // 1. Check if browser can share files natively
  if (typeof navigator !== 'undefined' && 'share' in navigator && typeof File !== 'undefined') {
    try {
      const file = new File([blob], fileName, { type: 'image/png' });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title,
          text,
          files: [file]
        });
        return { success: true, method: 'native-file' };
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        return { success: false, method: 'native-file' };
      }
      // If file share failed or not allowed, continue to fallback
    }

    // 2. Try standard native share with URL and text
    try {
      await navigator.share({
        title,
        text,
        url: shareUrl
      });
      // Also download the PNG card for them so they have the card format image!
      await downloadWeatherSummaryCardImage(options);
      return { success: true, method: 'native-url' };
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        return { success: false, method: 'native-url' };
      }
    }
  }

  // 3. Fallback: Download the PNG card and copy link to clipboard
  await downloadWeatherSummaryCardImage(options);
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {}
  }
  return { success: true, method: 'download' };
}
