import React, { useState, useEffect, useRef } from 'react';
import { PlaceLocation, FavoritePlace } from '../types';
import { searchPlacesOpenMeteo, getFlagEmoji } from '../utils/weather';
import { Search, Navigation, Star, X } from 'lucide-react';

interface HeaderProps {
  currentPlace: PlaceLocation;
  onSelectPlace: (place: PlaceLocation) => void;
  unit: 'C' | 'F';
  onToggleUnit: (unit: 'C' | 'F') => void;
  onLocateMe: () => void;
  isLocating: boolean;
  favorites: FavoritePlace[];
  onToggleFavorite: () => void;
  isFavorite: boolean;
  onRemoveFavorite: (index: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPlace,
  onSelectPlace,
  unit,
  onToggleUnit,
  onLocateMe,
  isLocating,
  favorites,
  onRemoveFavorite
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchPlacesOpenMeteo(searchTerm.trim());
        setSearchResults(results);
        setShowResults(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside search dismiss
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-[1200] bg-[#FFFBF6]/85 backdrop-blur-xl border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        {/* App Branding */}
        <div
          className="flex items-center gap-2.5 shrink-0 cursor-pointer select-none"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFD6C9] via-[#E8D6F5] to-[#BFE3D0] flex items-center justify-center shadow-soft">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <circle cx="13" cy="13" r="6" fill="#FFD66B" stroke="#fff" strokeWidth="1.5" />
              <g stroke="#E9A93F" strokeWidth="1.6" strokeLinecap="round">
                <line x1="13" y1="3" x2="13" y2="5.5" />
                <line x1="5" y1="13" x2="7.5" y2="13" />
                <line x1="7.4" y1="7.4" x2="9.2" y2="9.2" />
                <line x1="18.6" y1="7.4" x2="16.8" y2="9.2" />
              </g>
              <path
                d="M10 24a5 5 0 0 1 1-9.9A7 7 0 0 1 24.5 15 4.5 4.5 0 0 1 23 24H10Z"
                fill="white"
                stroke="#D9CFE8"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="font-display font-bold text-[19px] tracking-tight">Mellow</div>
            <div className="text-[11px] font-bold text-muted tracking-[.14em] uppercase -mt-1">
              Pastel Weather
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-2xl mx-auto">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowResults(true);
            }}
            placeholder="Search cities, regions… e.g. Paris, Tokyo, London"
            className="w-full pill bg-white border border-line pl-11 pr-11 py-2 text-[14px] font-semibold placeholder:text-muted/70 placeholder:font-medium shadow-card focus:border-[#C9B8E8] focus:ring-4 focus:ring-[#ECE8F6] transition outline-none text-ink"
          />

          {searchTerm && !isSearching && (
            <button
              onClick={() => {
                setSearchTerm('');
                setShowResults(false);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1 transition"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}

          {isSearching && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 rounded-full border-2 border-[#E8D9E8] border-t-[#8E7CC3] animate-spin" />
            </div>
          )}

          {/* Autocomplete dropdown */}
          {showResults && (
            <div className="absolute top-[46px] left-0 right-0 bg-white rounded-3xl border border-line search-drop overflow-hidden z-[1300] max-h-[380px] overflow-y-auto shadow-card">
              {searchResults.length === 0 ? (
                <div className="p-4 text-sm font-bold text-muted text-center">
                  No cities found for &quot;{searchTerm}&quot;
                </div>
              ) : (
                searchResults.map((place, idx) => (
                  <button
                    key={`${place.lat}-${place.lon}-${idx}`}
                    onClick={() => {
                      onSelectPlace(place);
                      setShowResults(false);
                      setSearchTerm('');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[#FFFBF2] transition flex items-center gap-3 border-b border-line last:border-0"
                  >
                    <span className="text-2xl">{getFlagEmoji(place.cc)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-[14.5px] truncate text-ink">{place.name}</div>
                      <div className="text-[12px] font-semibold text-muted truncate">
                        {[place.admin, place.country].filter(Boolean).join(" · ")} · {place.lat.toFixed(2)}°, {place.lon.toFixed(2)}°
                      </div>
                    </div>
                    <span className="text-muted text-sm font-bold">→</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Single Unified Temperature Unit Switcher */}
        <div className="seg items-center shrink-0 shadow-2xs">
          <button
            onClick={() => onToggleUnit('C')}
            className={unit === 'C' ? 'active' : ''}
            title="Celsius (°C · km/h)"
          >
            <span className="hidden sm:inline">°C · km/h</span>
            <span className="sm:hidden">°C</span>
          </button>
          <button
            onClick={() => onToggleUnit('F')}
            className={unit === 'F' ? 'active' : ''}
            title="Fahrenheit (°F · mph)"
          >
            <span className="hidden sm:inline">°F · mph</span>
            <span className="sm:hidden">°F</span>
          </button>
        </div>

        {/* Locate Me GPS Button */}
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          title="Detect your current location via GPS"
          className="shrink-0 pill bg-[#2E2E3E] text-white text-[13px] font-bold px-3.5 sm:px-4 py-2 flex items-center gap-2 hover:bg-[#1E1E2C] active:scale-95 transition shadow-xs disabled:opacity-70 border border-[#2E2E3E]"
        >
          <Navigation size={15} className={isLocating ? "animate-spin text-[#FFD66B]" : "text-white"} />
          <span className="hidden md:inline">{isLocating ? "Locating…" : "Locate me"}</span>
          <span className="md:hidden">{isLocating ? "…" : "GPS"}</span>
        </button>
      </div>

      {/* Pinned / Favorites Bar - Clean, dedicated row with no duplicate toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-2.5 pt-0.5 flex items-center gap-2.5">
        <div className="shrink-0 pill px-2.5 py-1 bg-butter text-butter-dark border border-[#EADB9E] text-[11px] font-black tracking-wider flex items-center gap-1.5 shadow-2xs">
          <Star size={12} fill="currentColor" />
          <span>PINNED</span>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 py-0.5 items-center">
          {favorites.length === 0 ? (
            <span className="text-[12px] font-bold text-muted/80 py-1">
              Tap the ☆ star on any city to pin it here for quick 1-tap access (e.g. Tokyo, Paris, New York)
            </span>
          ) : (
            favorites.map((fav, index) => {
              const isSelected =
                Math.abs(fav.lat - currentPlace.lat) < 0.02 &&
                Math.abs(fav.lon - currentPlace.lon) < 0.02;

              return (
                <div
                  key={`${fav.lat}-${fav.lon}-${index}`}
                  onClick={() => onSelectPlace(fav)}
                  className={`shrink-0 pill border pl-2.5 pr-2 py-1 flex items-center gap-1.5 shadow-2xs cursor-pointer transition ${
                    isSelected
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white border-line text-ink hover:bg-[#FFFBF2] hover:border-[#DACFC0]'
                  }`}
                >
                  <span className="text-sm">{getFlagEmoji(fav.cc)}</span>
                  <span className="text-[12.5px] font-extrabold whitespace-nowrap">{fav.name}</span>
                  {fav.t != null && (
                    <span className={`text-[11px] font-bold ${isSelected ? 'opacity-80 text-white' : 'text-muted'}`}>
                      {unit === 'C' ? `${Math.round(fav.t)}°` : `${Math.round(fav.t * 9 / 5 + 32)}°`}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFavorite(index);
                    }}
                    title={`Remove ${fav.name} from pinned`}
                    className={`p-0.5 rounded-full transition ${
                      isSelected ? 'text-white/60 hover:text-white' : 'text-muted hover:text-ink'
                    }`}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </header>
  );
};
