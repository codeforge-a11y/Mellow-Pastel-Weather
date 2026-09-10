import React, { useState, useEffect } from 'react';
import { PlaceLocation, WeatherData } from '../types';
import {
  downloadWeatherSummaryCardImage,
  copyWeatherCardImageToClipboard,
  shareWeatherCardAsPng
} from '../utils/weatherCardImage';
import {
  X,
  Copy,
  Check,
  Download,
  Share2,
  Sparkles,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: PlaceLocation;
  weather: WeatherData;
  unit: 'C' | 'F';
  tzOffsetSec: number;
}

type CopyFormat = 'link' | 'text' | 'image';

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  location,
  weather,
  unit,
  tzOffsetSec
}) => {
  const [copyFormat, setCopyFormat] = useState<CopyFormat>('link');
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Format date for the card
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const localDate = new Date(utc + tzOffsetSec * 1000);
  const formattedDate = localDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  });

  const toTemp = (val: number | null | undefined): number => {
    if (val == null || isNaN(val)) return 0;
    return unit === 'C' ? Math.round(val) : Math.round((val * 9) / 5 + 32);
  };

  const tempVal = toTemp(weather.current.temperature_2m);
  const feelsLikeVal = toTemp(weather.current.apparent_temperature);
  const hiVal = toTemp(weather.daily.temperature_2m_max[0]);
  const loVal = toTemp(weather.daily.temperature_2m_min[0]);
  const scaleText = unit === 'C' ? 'Celcius' : 'Fahrenheit';

  const shareUrl = `${window.location.origin}${window.location.pathname}?lat=${location.lat.toFixed(4)}&lon=${location.lon.toFixed(4)}&name=${encodeURIComponent(location.name)}`;

  const textSummary = `☀️ Weather in ${location.name}${location.country ? `, ${location.country}` : ''}
🌡️ ${tempVal}° ${scaleText} (Feels like ${feelsLikeVal}°) · ${weather.current.description}
📊 High: ${hiVal}° / Low: ${loVal}° · 💧 Humidity: ${weather.current.relative_humidity_2m}%
📅 ${formattedDate}
🔗 Live view: ${shareUrl}`;

  // Master 'Copy to Clipboard' handler
  const handleCopyToClipboard = async (overrideFormat?: CopyFormat) => {
    const targetFormat = overrideFormat || copyFormat;
    setIsProcessing(true);

    try {
      if (targetFormat === 'link') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          setCopiedState('Link copied to clipboard!');
        }
      } else if (targetFormat === 'text') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(textSummary);
          setCopiedState('Text summary copied to clipboard!');
        }
      } else if (targetFormat === 'image') {
        const ok = await copyWeatherCardImageToClipboard({
          location,
          weather,
          unit,
          tzOffsetSec
        });
        if (ok) {
          setCopiedState('PNG Card image copied to clipboard!');
        } else {
          // Fallback: download card image & copy link
          await downloadWeatherSummaryCardImage({
            location,
            weather,
            unit,
            tzOffsetSec
          });
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareUrl);
          }
          setCopiedState('PNG Card saved & link copied!');
        }
      }
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
      setCopiedState('Failed to copy. Please try again.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setCopiedState(null), 2500);
    }
  };

  // Dedicated "Share Location as PNG Card" handler
  const handleShareLocationPngCard = async () => {
    setIsProcessing(true);
    setShareStatus('Preparing PNG card...');
    try {
      const result = await shareWeatherCardAsPng({
        location,
        weather,
        unit,
        tzOffsetSec
      });

      if (result.success) {
        if (result.method === 'native-file') {
          setShareStatus('Shared PNG card!');
        } else if (result.method === 'native-url') {
          setShareStatus('Shared link & card saved!');
        } else {
          setShareStatus('PNG card saved & link copied!');
        }
      } else {
        setShareStatus(null);
      }
    } catch (err) {
      console.error('Failed to share PNG card:', err);
      setShareStatus('Download card PNG');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setShareStatus(null), 3000);
    }
  };

  // Direct PNG Download
  const handleDownloadPng = async () => {
    setIsProcessing(true);
    try {
      await downloadWeatherSummaryCardImage({
        location,
        weather,
        unit,
        tzOffsetSec
      });
      setCopiedState('PNG card downloaded!');
    } catch (err) {
      console.error('Failed to download card:', err);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setCopiedState(null), 2500);
    }
  };

  return (
    <div
      id="share-card-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="share-card-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[460px] max-h-[92vh] flex flex-col bg-[#FFFBF7] border border-line rounded-3xl p-5 sm:p-6 shadow-2xl overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-[19px] sm:text-[20px] text-ink">
                Share Weather Card
              </h3>
              <span className="pill bg-butter border border-[#EADB9E] px-2.5 py-0.5 text-[10.5px] font-black text-amber-800 flex items-center gap-1 shadow-2xs">
                <Sparkles size={11} />
                PNG CARD
              </span>
            </div>
            <p className="text-[12px] sm:text-[12.5px] font-bold text-muted mt-0.5">
              Copy to clipboard or share location in PNG card format
            </p>
          </div>
          <button
            id="close-share-card-modal-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-line flex items-center justify-center text-muted hover:text-ink transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* The Uiverse.io Card Implementation */}
        {/* From Uiverse.io by zanina-yassine */}
        <div className="uiverse-card-wrapper my-2">
          <div
            className="card"
            onClick={() => handleCopyToClipboard('link')}
            title="Click card to copy share link"
          >
            <div className="container">
              <div className="cloud front">
                <span className="left-front"></span>
                <span className="right-front"></span>
              </div>
              <span className="sun sunshine"></span>
              <span className="sun"></span>
              <div className="cloud back">
                <span className="left-back"></span>
                <span className="right-back"></span>
              </div>
            </div>

            <div className="card-header">
              <span>
                {location.name}
                {location.admin ? `, ${location.admin}` : ''}
                <br />
                {location.country || ''}
              </span>
              <span>{formattedDate}</span>
            </div>

            <span className="temp">{tempVal}°</span>

            <div className="temp-scale">
              <span>{scaleText}</span>
            </div>
          </div>
        </div>

        {/* Copy to Clipboard Format Selector */}
        <div className="mt-3 p-3.5 bg-white rounded-2xl border border-line shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold text-muted uppercase tracking-wider">
              Copy to Clipboard format
            </span>
            <span className="text-[11px] font-bold text-amber-800 bg-[#FFF5D6] px-2 py-0.5 rounded-md">
              {copyFormat === 'link' ? 'URL Link' : copyFormat === 'text' ? 'Formatted Text' : 'PNG Image'}
            </span>
          </div>

          {/* Format Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-light rounded-xl border border-line/60">
            <button
              id="format-tab-link"
              type="button"
              onClick={() => setCopyFormat('link')}
              className={`py-1.5 px-2 rounded-lg text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                copyFormat === 'link'
                  ? 'bg-white text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <LinkIcon size={13} />
              <span>Link</span>
            </button>
            <button
              id="format-tab-text"
              type="button"
              onClick={() => setCopyFormat('text')}
              className={`py-1.5 px-2 rounded-lg text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                copyFormat === 'text'
                  ? 'bg-white text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <FileText size={13} />
              <span>Summary</span>
            </button>
            <button
              id="format-tab-image"
              type="button"
              onClick={() => setCopyFormat('image')}
              className={`py-1.5 px-2 rounded-lg text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                copyFormat === 'image'
                  ? 'bg-white text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <ImageIcon size={13} />
              <span>PNG Card</span>
            </button>
          </div>

          {/* Content Preview Box */}
          <div className="bg-[#FAF8F5] border border-line/60 rounded-xl p-2.5 text-[11.5px] font-mono text-ink/80 max-h-[72px] overflow-y-auto select-all leading-relaxed">
            {copyFormat === 'link' && (
              <p className="truncate text-ink font-semibold">{shareUrl}</p>
            )}
            {copyFormat === 'text' && (
              <p className="whitespace-pre-line text-ink/90">{textSummary}</p>
            )}
            {copyFormat === 'image' && (
              <p className="font-sans text-muted font-bold text-[12px]">
                🎨 Copies high-resolution PNG weather card directly to clipboard (can be pasted into chat, docs, or messages)
              </p>
            )}
          </div>

          {/* Master Copy to Clipboard Button */}
          <button
            id="copy-to-clipboard-btn"
            type="button"
            onClick={() => handleCopyToClipboard()}
            disabled={isProcessing}
            className={`w-full pill py-2.5 px-4 text-[13px] font-bold border flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 shadow-sm ${
              copiedState
                ? 'bg-[#E5F5EC] text-[#1E7448] border-[#BDE7CB]'
                : 'bg-ink text-white hover:bg-ink-light border-ink'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : copiedState ? (
              <>
                <Check size={16} strokeWidth={2.5} />
                <span>{copiedState}</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>
                  Copy {copyFormat === 'link' ? 'Link' : copyFormat === 'text' ? 'Weather Summary' : 'PNG Card Image'} to Clipboard
                </span>
              </>
            )}
          </button>
        </div>

        {/* Share Location in PNG(card) format & Action Controls */}
        <div className="mt-3 space-y-2">
          {/* Primary Share Location as PNG Button */}
          <button
            id="share-location-png-card-btn"
            type="button"
            onClick={handleShareLocationPngCard}
            disabled={isProcessing}
            className={`w-full pill py-2.5 px-4 text-[13px] font-bold border flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 shadow-card ${
              shareStatus
                ? 'bg-[#E5F5EC] text-[#1E7448] border-[#BDE7CB]'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-amber-600'
            }`}
          >
            {isProcessing && shareStatus ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{shareStatus}</span>
              </>
            ) : shareStatus ? (
              <>
                <Check size={16} strokeWidth={2.5} />
                <span>{shareStatus}</span>
              </>
            ) : (
              <>
                <Share2 size={16} />
                <span>Share Location (PNG Card Format)</span>
              </>
            )}
          </button>

          {/* Quick Action Footer: Save PNG & Direct Link */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="download-card-png-btn"
              type="button"
              onClick={handleDownloadPng}
              disabled={isProcessing}
              className="pill py-2 px-3 text-[12px] font-bold border border-line bg-white text-ink hover:bg-neutral-light flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs disabled:opacity-50"
            >
              <Download size={14} />
              <span>Save PNG File</span>
            </button>

            <button
              id="quick-copy-link-btn"
              type="button"
              onClick={() => handleCopyToClipboard('link')}
              className="pill py-2 px-3 text-[12px] font-bold border border-line bg-white text-ink hover:bg-neutral-light flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
            >
              <Copy size={14} />
              <span>Copy Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
