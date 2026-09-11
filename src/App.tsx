import { useState, useEffect, useCallback } from 'react';
import { PlaceLocation, WeatherData, AirQualityData, WeatherAlert, FavoritePlace } from './types';
import { fetchWeatherDetails, fetchNWSAlerts, buildDerivedAlerts } from './utils/weather';
import { Header } from './components/Header';
import { Alerts } from './components/Alerts';
import { CurrentWeather } from './components/CurrentWeather';
import { SunMoon } from './components/SunMoon';
import { HourlyForecast } from './components/HourlyForecast';
import { DailyForecast } from './components/DailyForecast';
import { MetricsGrid } from './components/MetricsGrid';
import { MapRadar } from './components/MapRadar';
import { LifestyleHealth } from './components/LifestyleHealth';
import { ShareCardModal } from './components/ShareCardModal';

const DEFAULT_LOCATION: PlaceLocation = {
  lat: 40.7128,
  lon: -74.006,
  name: "New York",
  country: "United States",
  cc: "US",
  admin: "New York"
};

export default function App() {
  const [location, setLocation] = useState<PlaceLocation>(() => {
    try {
      const saved = localStorage.getItem('mellow_last');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_LOCATION;
  });

  const [unit, setUnit] = useState<'C' | 'F'>(() => {
    try {
      const saved = localStorage.getItem('mellow_unit');
      if (saved === 'C' || saved === 'F') return saved;
    } catch {
      // fallback
    }
    return 'C';
  });

  const [favorites, setFavorites] = useState<FavoritePlace[]>(() => {
    try {
      const saved = localStorage.getItem('mellow_favs');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      { lat: 40.7128, lon: -74.006, name: "New York", country: "United States", cc: "US", t: 18 },
      { lat: 35.6762, lon: 139.6503, name: "Tokyo", country: "Japan", cc: "JP", t: 22 },
      { lat: 48.8566, lon: 2.3522, name: "Paris", country: "France", cc: "FR", t: 16 }
    ];
  });

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [air, setAir] = useState<AirQualityData | null>(null);
  const [tzOffsetSec, setTzOffsetSec] = useState<number>(0);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string; emoji: string }[]>([]);

  // Show a toast message
  const showToast = useCallback((msg: string, emoji: string = "✨") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, emoji }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  // Save unit
  const handleToggleUnit = (newUnit: 'C' | 'F') => {
    setUnit(newUnit);
    localStorage.setItem('mellow_unit', newUnit);
  };

  // Load weather data for the current location
  const loadWeather = useCallback(async (loc: PlaceLocation) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { weather: wData, air: aData, tzOffsetSec: tz } = await fetchWeatherDetails(loc.lat, loc.lon);
      setWeather(wData);
      setAir(aData);
      setTzOffsetSec(tz);

      // Fetch official NWS alerts (for US) + build smart derived alerts
      const nws = await fetchNWSAlerts(loc.lat, loc.lon);
      const derived = buildDerivedAlerts(wData, aData, unit);
      setAlerts([...nws, ...derived]);

      // Save last location
      localStorage.setItem('mellow_last', JSON.stringify(loc));
    } catch (err: any) {
      console.error("Failed to load weather:", err);
      setLoadError(err?.message || "Weather service temporarily unavailable");
      showToast("Weather service temporarily unavailable", "🌧️");
    } finally {
      setIsLoading(false);
    }
  }, [unit, showToast]);

  // Initial load
  useEffect(() => {
    loadWeather(location);
  }, [location.lat, location.lon]);

  // Select place from search or favorites
  const handleSelectPlace = (place: PlaceLocation) => {
    setLocation(place);
    showToast(`Showing weather for ${place.name}`, "📍");
  };

  // Check if current place is in favorites
  const isFavorite = favorites.some(
    f => Math.abs(f.lat - location.lat) < 0.05 && Math.abs(f.lon - location.lon) < 0.05
  );

  const handleToggleFavorite = () => {
    if (isFavorite) {
      const next = favorites.filter(
        f => !(Math.abs(f.lat - location.lat) < 0.05 && Math.abs(f.lon - location.lon) < 0.05)
      );
      setFavorites(next);
      localStorage.setItem('mellow_favs', JSON.stringify(next));
      showToast(`Removed ${location.name} from pinned`, "🗑️");
    } else {
      const newFav: FavoritePlace = {
        ...location,
        t: weather?.current.temperature_2m
      };
      const next = [newFav, ...favorites].slice(0, 10);
      setFavorites(next);
      localStorage.setItem('mellow_favs', JSON.stringify(next));
      showToast(`Pinned ${location.name} to header ☆`, "💛");
    }
  };

  const handleRemoveFavorite = (index: number) => {
    const next = [...favorites];
    next.splice(index, 1);
    setFavorites(next);
    localStorage.setItem('mellow_favs', JSON.stringify(next));
    showToast("Removed from pinned", "🗑️");
  };

  // Share location card-wise
  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // GPS Locate Me
  const handleLocateMe = async () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = +pos.coords.latitude.toFixed(4);
          const lon = +pos.coords.longitude.toFixed(4);

          try {
            const url = `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`;
            const r = await fetch(url);
            const j = await r.json();
            const p = j?.results?.[0];
            const loc: PlaceLocation = {
              lat,
              lon,
              name: p?.name || "Current Location",
              country: p?.country || "",
              cc: p?.country_code || ""
            };
            setLocation(loc);
            showToast(`Found your location: ${loc.name}`, "📍");
          } catch {
            setLocation({ lat, lon, name: "Current Location", country: "", cc: "" });
            showToast("Detected your GPS coordinates", "📍");
          } finally {
            setIsLocating(false);
          }
        },
        async () => {
          // Geolocation permission denied or unavailable -> fallback to IP lookup
          try {
            const res = await fetch("https://ipapi.co/json/");
            const j = await res.json();
            if (j.latitude && j.longitude) {
              const loc: PlaceLocation = {
                lat: j.latitude,
                lon: j.longitude,
                name: j.city || "My Area",
                country: j.country_name || "",
                cc: j.country_code || ""
              };
              setLocation(loc);
              showToast(`Detected ${loc.name} via network`, "🌐");
            } else {
              showToast("Location detection unavailable", "🌧️");
            }
          } catch {
            showToast("Location detection unavailable", "🌧️");
          } finally {
            setIsLocating(false);
          }
        },
        { timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      showToast("Geolocation not supported by your browser", "🌧️");
    }
  };

  return (
    <div className="min-h-screen relative font-body text-ink">
      {/* Ambient pastel background blobs */}
      <div className="blob w-[520px] h-[520px] bg-[#FFE4D6] -top-40 -left-40" />
      <div className="blob w-[460px] h-[460px] bg-[#E6EFF7] top-20 right-[-120px]" />
      <div className="blob w-[420px] h-[420px] bg-[#ECE8F6] bottom-[15%] left-[-140px]" />
      <div className="blob w-[380px] h-[380px] bg-[#E9F3E7] bottom-[-100px] right-[10%]" />

      {/* Toast Notifications */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[3000] flex flex-col gap-2 items-center w-[92%] max-w-md pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="pill bg-ink text-white text-[13px] font-bold px-5 py-3 shadow-pop flex items-center gap-2 pointer-events-auto transition animate-in fade-in slide-in-from-bottom-2"
          >
            <span>{t.emoji}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Top Navigation Header */}
      <Header
        currentPlace={location}
        onSelectPlace={handleSelectPlace}
        unit={unit}
        onToggleUnit={handleToggleUnit}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={isFavorite}
        onRemoveFavorite={handleRemoveFavorite}
      />

      {/* Main Content Dashboard */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {/* Weather Alerts Banner */}
        <Alerts alerts={alerts} />

        {weather ? (
          <>
            {/* Top Grid: Hero Weather Card (2 cols) & Sun/Moon Card (1 col) */}
            <section className="grid lg:grid-cols-3 gap-5 mt-5">
              <div className="lg:col-span-2">
                <CurrentWeather
                  location={location}
                  weather={weather}
                  unit={unit}
                  tzOffsetSec={tzOffsetSec}
                  isFavorite={isFavorite}
                  onToggleFavorite={handleToggleFavorite}
                  onShare={handleShare}
                />
              </div>
              <div className="lg:col-span-1">
                <SunMoon weather={weather} tzOffsetSec={tzOffsetSec} />
              </div>
            </section>

            {/* Hourly Forecast Timeline with Interactive Chart */}
            <HourlyForecast weather={weather} unit={unit} />

            {/* 5-Day Outlook & Environmental Metrics */}
            <section className="grid lg:grid-cols-5 gap-5 mt-5">
              <div className="lg:col-span-2">
                <DailyForecast weather={weather} unit={unit} />
              </div>
              <div className="lg:col-span-3">
                <MetricsGrid weather={weather} air={air} unit={unit} />
              </div>
            </section>

            {/* Interactive Radar & Leaflet Maps (Addressing all map zooming issues) + Lifestyle Health */}
            <section className="grid lg:grid-cols-3 gap-5 mt-5">
              <div className="lg:col-span-2">
                <MapRadar
                  location={location}
                  temperature={weather.current.temperature_2m}
                  description={weather.current.description}
                  unit={unit}
                />
              </div>
              <div className="lg:col-span-1">
                <LifestyleHealth weather={weather} air={air} unit={unit} />
              </div>
            </section>
          </>
        ) : loadError && !isLoading ? (
          /* Error State with Retry */
          <div className="card p-10 mt-8 text-center flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
            <span className="text-4xl" role="img" aria-label="Cloud with rain">🌧️</span>
            <div className="font-display font-bold text-xl text-ink">
              Unable to load weather data
            </div>
            <div className="text-sm text-muted leading-relaxed">
              {loadError}
            </div>
            <button
              onClick={() => loadWeather(location)}
              className="pill mt-2 bg-[#9B87F5] hover:bg-[#8B75E5] text-white font-bold px-6 py-2.5 transition active:scale-95 shadow-sm"
            >
              Try Again
            </button>
          </div>
        ) : (
          /* Loading Skeleton */
          <div className="card p-12 mt-8 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-3 border-[#C9B8E8] border-t-transparent animate-spin" />
            <div className="font-display font-bold text-xl text-ink">
              Loading weather data for {location.name}…
            </div>
            <div className="text-sm font-semibold text-muted">
              Connecting to satellites and radar streams
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-[12.5px] font-semibold text-muted pb-4">
          Crafted with care · Data powered by{" "}
          <a
            className="underline decoration-[#C9B8E8] hover:text-ink"
            href="https://openweathermap.org"
            target="_blank"
            rel="noreferrer"
          >
            OpenWeatherMap
          </a>
          ,{" "}
          <a
            className="underline decoration-[#C9B8E8] hover:text-ink"
            href="https://www.rainviewer.com"
            target="_blank"
            rel="noreferrer"
          >
            RainViewer HD
          </a>
          , and NWS Alerts · Map tiles by OpenStreetMap & Esri
          <div className="mt-1 text-[11.5px] text-muted/80">
            Unrestricted zoom (levels 3–19), HD radar upscaling, page-scroll protection & custom pastel controls
          </div>
        </footer>

        {weather && (
          <ShareCardModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            location={location}
            weather={weather}
            unit={unit}
            tzOffsetSec={tzOffsetSec}
          />
        )}
      </main>
    </div>
  );
}
