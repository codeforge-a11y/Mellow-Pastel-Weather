import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PlaceLocation, RadarFrame } from '../types';
import { Play, Pause, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, MousePointer, Satellite, Map, Layers } from 'lucide-react';

interface MapRadarProps {
  location: PlaceLocation;
  temperature?: number | null;
  description?: string;
  unit: 'C' | 'F';
}

export const MapRadar: React.FC<MapRadarProps> = ({ location, temperature, description, unit }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const baseLayersRef = useRef<{ [key: string]: L.TileLayer }>({});
  const radarLayerRef = useRef<L.TileLayer | null>(null);

  const [baseMap, setBaseMap] = useState<'light' | 'sat' | 'terrain'>('light');
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [radarOn, setRadarOn] = useState<boolean>(true);
  const [opacity, setOpacity] = useState<number>(0.7);
  const [scrollZoomEnabled, setScrollZoomEnabled] = useState<boolean>(false);
  const [currentZoom, setCurrentZoom] = useState<number>(7);
  const [radarTimeText, setRadarTimeText] = useState<string>("Loading radar…");

  // 1. Initialize Leaflet Map with all zooming issue fixes
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // FIX 1: Set zoomControl: false to PREVENT DUPLICATE ZOOM CONTROLS
    // FIX 2: Set zoomSnap: 1 & zoomDelta: 1 to PREVENT BLURRY TILES from fractional zoom
    // FIX 3: Set scrollWheelZoom: false initially to prevent hijacking the page scroll
    // FIX 4: Set minZoom: 3 and maxZoom: 18 to bound map zooming
    const map = L.map(mapContainerRef.current, {
      center: [location.lat, location.lon],
      zoom: 7,
      minZoom: 3,
      maxZoom: 19,
      zoomControl: false, // We supply custom pastel zoom controls
      scrollWheelZoom: false,
      zoomSnap: 1,
      zoomDelta: 1,
      wheelPxPerZoomLevel: 120
    });

    mapInstanceRef.current = map;

    // Track current zoom level for display
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Setup base layers with 100% free, high-zoom, non-watermarked providers:
    // OpenStreetMap (supports zoom 0-19 with zero watermark/API key)
    const light = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
    });

    // Esri World Imagery (high-res satellite up to zoom 19)
    const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      attribution: "© Esri"
    });

    // Esri World Topographic Map (terrain, contours & elevation up to zoom 19 without rate limits)
    const terrain = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      attribution: "© Esri Topo"
    });

    baseLayersRef.current = { light, sat, terrain };
    light.addTo(map);

    // Pulse marker for location
    const marker = L.marker([location.lat, location.lon], {
      icon: L.divIcon({
        className: "pastel-marker",
        html: `<div class="pulse-marker" title="${location.name}"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })
    }).addTo(map);

    markerRef.current = marker;

    // Invalidate size on container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    setTimeout(() => {
      map.invalidateSize();
    }, 400);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update base layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !baseLayersRef.current) return;

    Object.values(baseLayersRef.current).forEach(layer => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    const target = baseLayersRef.current[baseMap];
    if (target) {
      target.addTo(map);
      if (radarLayerRef.current && radarOn) {
        radarLayerRef.current.bringToFront();
      }
    }
  }, [baseMap, radarOn]);

  // Update location center smoothly without jarring zoom reset
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMapZoom = map.getZoom();
    const targetZoom = currentMapZoom && currentMapZoom >= 5 && currentMapZoom <= 14 ? currentMapZoom : 8;

    map.flyTo([location.lat, location.lon], targetZoom, {
      duration: 1.2
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([location.lat, location.lon]);
      const tempDisplay = temperature != null ? (unit === 'C' ? `${Math.round(temperature)}°C` : `${Math.round(temperature * 9 / 5 + 32)}°F`) : "";
      markerRef.current.bindPopup(`
        <div style="font-family: 'Nunito', sans-serif; padding: 4px;">
          <strong style="font-size: 14px; color: #4B4B5E;">${location.name}</strong><br/>
          <span style="font-size: 13px; color: #8E8EA3;">${tempDisplay} ${description ? `· ${description}` : ''}</span>
        </div>
      `).openPopup();

      setTimeout(() => {
        markerRef.current?.closePopup();
      }, 3000);
    }
  }, [location.lat, location.lon, location.name, temperature, description, unit]);

  // Load RainViewer Radar Frames
  useEffect(() => {
    async function loadRadar() {
      try {
        const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        const data = await res.json();
        const frames: RadarFrame[] = [...(data.radar?.past || []), ...(data.radar?.nowcast || [])].slice(-14);
        if (frames.length > 0) {
          setRadarFrames(frames);
          setCurrentFrameIdx(frames.length - 1);
        } else {
          setRadarTimeText("Radar unavailable");
        }
      } catch (err) {
        console.warn("Radar load error:", err);
        setRadarTimeText("Radar offline");
      }
    }
    loadRadar();
  }, []);

  // Update Radar Layer on frame/opacity/radarOn changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!radarOn || radarFrames.length === 0) {
      if (radarLayerRef.current) {
        map.removeLayer(radarLayerRef.current);
        radarLayerRef.current = null;
      }
      return;
    }

    const frame = radarFrames[currentFrameIdx];
    if (!frame) return;

    if (radarLayerRef.current) {
      map.removeLayer(radarLayerRef.current);
    }

    // Set maxNativeZoom: 12 & maxZoom: 19 so radar tiles cleanly upscale up to zoom 19
    const newRadarLayer = L.tileLayer(
      `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`,
      {
        opacity: opacity,
        zIndex: 20,
        maxNativeZoom: 12,
        maxZoom: 19
      }
    ).addTo(map);

    radarLayerRef.current = newRadarLayer;

    const dt = new Date(frame.time * 1000);
    setRadarTimeText(dt.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }));
  }, [currentFrameIdx, radarFrames, radarOn, opacity]);

  // Radar Animation Loop
  useEffect(() => {
    if (!isPlaying || !radarOn || radarFrames.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentFrameIdx(prev => (prev + 1) % radarFrames.length);
    }, 950);

    return () => clearInterval(timer);
  }, [isPlaying, radarOn, radarFrames.length]);

  // Handle scroll wheel zoom toggle
  const toggleScrollZoom = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const nextState = !scrollZoomEnabled;
    setScrollZoomEnabled(nextState);
    if (nextState) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
  };

  const handleZoomIn = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.zoomIn();
  };

  const handleZoomOut = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.zoomOut();
  };

  const handleResetZoom = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([location.lat, location.lon], 8, { duration: 0.8 });
  };

  const stepRadar = (delta: number) => {
    if (radarFrames.length === 0) return;
    setCurrentFrameIdx(prev => (prev + delta + radarFrames.length) % radarFrames.length);
  };

  return (
    <div id="radar-section" className="card card-hover p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-[20px] flex items-center gap-2.5 text-ink">
            Live radar & maps
            <span className="pill bg-[#FFE4E9] text-[#932839] border border-[#F9C3CD] px-2.5 py-0.5 text-[10.5px] font-black tracking-widest flex items-center gap-1 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#932839] animate-pulse inline-block"></span>
              REC
            </span>
          </h2>
          <p className="text-[13px] font-bold text-muted mt-0.5">
            Smooth zoom, crisp precipitation radar & weather map layers
          </p>
        </div>

        {/* Basemap Switcher */}
        <div className="seg shadow-2xs">
          <button
            onClick={() => setBaseMap('light')}
            className={`seg-btn flex items-center gap-1.5 ${baseMap === 'light' ? 'active' : ''}`}
          >
            <Map size={13} />
            <span>Streets</span>
          </button>
          <button
            onClick={() => setBaseMap('sat')}
            className={`seg-btn flex items-center gap-1.5 ${baseMap === 'sat' ? 'active' : ''}`}
          >
            <Satellite size={13} />
            <span>Satellite</span>
          </button>
          <button
            onClick={() => setBaseMap('terrain')}
            className={`seg-btn flex items-center gap-1.5 ${baseMap === 'terrain' ? 'active' : ''}`}
          >
            <Layers size={13} />
            <span>Terrain</span>
          </button>
        </div>
      </div>

      {/* Radar Controls Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 mt-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? "Pause radar animation" : "Play radar animation"}
          className="w-9 h-9 rounded-xl bg-ink text-white flex items-center justify-center hover:bg-ink-light transition active:scale-95 shadow-card"
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
        </button>

        <button
          onClick={() => stepRadar(-1)}
          title="Previous frame"
          className="w-9 h-9 rounded-xl bg-white border border-line flex items-center justify-center hover:bg-neutral-light transition active:scale-95 text-ink shadow-2xs"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={() => stepRadar(1)}
          title="Next frame"
          className="w-9 h-9 rounded-xl bg-white border border-line flex items-center justify-center hover:bg-neutral-light transition active:scale-95 text-ink shadow-2xs"
        >
          <ChevronRight size={16} />
        </button>

        <div className="pill bg-white border border-line px-3.5 py-1.5 text-[12.5px] font-extrabold text-ink shadow-2xs flex items-center gap-2">
          <Satellite size={15} className="text-[#1D6C9F]" />
          <span>{radarTimeText}</span>
        </div>

        {/* Radar Opacity Slider */}
        <div className="ml-auto flex items-center gap-2 text-[12px] font-bold text-muted">
          <span>Opacity</span>
          <input
            type="range"
            min="20"
            max="100"
            value={Math.round(opacity * 100)}
            onChange={(e) => setOpacity(Number(e.target.value) / 100)}
            className="w-20 accent-sky-dark cursor-pointer"
          />
        </div>

        {/* Radar Toggle */}
        <button
          onClick={() => setRadarOn(!radarOn)}
          className={`pill px-3.5 py-1.5 text-[12px] font-black transition ${
            radarOn
              ? 'bg-[#EAF7EE] text-[#1B633D] border border-[#BDE7CB] shadow-2xs'
              : 'bg-white border border-line text-muted shadow-2xs'
          }`}
        >
          {radarOn ? "Radar ON" : "Radar OFF"}
        </button>
      </div>

      {/* Map Container */}
      <div className="mt-3 rounded-[24px] overflow-hidden border border-line shadow-card relative">
        <div
          ref={mapContainerRef}
          style={{ height: '390px', minHeight: '390px', width: '100%' }}
          className="z-0"
        />

        {/* Custom Pastel Zoom & Navigation Controls Overlay */}
        <div className="absolute top-3 right-3 z-[500] flex flex-col gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-card border border-white/80">
          <button
            onClick={handleZoomIn}
            title="Zoom in (Crisp tiles)"
            className="w-8 h-8 rounded-xl bg-white hover:bg-[#FFF0DD] text-ink font-bold flex items-center justify-center shadow-xs transition active:scale-95"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom out"
            className="w-8 h-8 rounded-xl bg-white hover:bg-[#FFF0DD] text-ink font-bold flex items-center justify-center shadow-xs transition active:scale-95"
          >
            <ZoomOut size={16} />
          </button>
          <div className="h-px bg-line mx-1 my-0.5"></div>
          <button
            onClick={handleResetZoom}
            title="Reset to center (Zoom 8)"
            className="w-8 h-8 rounded-xl bg-white hover:bg-[#FFF0DD] text-ink font-bold flex items-center justify-center shadow-xs transition active:scale-95"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={toggleScrollZoom}
            title={scrollZoomEnabled ? "Scroll-wheel zoom enabled (click to lock page scroll)" : "Click to enable scroll-wheel zoom"}
            className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs transition active:scale-95 ${
              scrollZoomEnabled ? 'bg-[#4B4B5E] text-white' : 'bg-white hover:bg-[#FFF0DD] text-muted'
            }`}
          >
            <MousePointer size={15} />
          </button>
        </div>

        {/* Current Zoom Level Badge & Scroll Hint */}
        <div className="absolute top-3 left-3 z-[500] flex items-center gap-2">
          <div className="bg-white/90 backdrop-blur-md pill px-3 py-1 text-[11px] font-extrabold text-ink shadow-sm border border-white/80">
            Zoom Level {currentZoom}x {currentZoom >= 13 ? "(Street/HD Radar)" : currentZoom >= 8 ? "(City)" : "(Regional)"}
          </div>
          {!scrollZoomEnabled && (
            <div className="hidden sm:inline-block bg-white/85 backdrop-blur-md pill px-2.5 py-1 text-[10.5px] font-bold text-muted shadow-sm border border-white/80">
              Scroll locked (use +/− or tap cursor icon)
            </div>
          )}
        </div>

        {/* Rain Intensity Legend */}
        <div className="absolute bottom-3 left-3 z-[500] bg-white/90 backdrop-blur-md pill px-3 py-1.5 text-[11px] font-bold shadow-sm flex items-center gap-2 border border-white/80">
          <span className="flex gap-1">
            <i className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#7ED6F0' }}></i>
            <i className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#5FBF7A' }}></i>
            <i className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#FFE066' }}></i>
            <i className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#FF9E6B' }}></i>
            <i className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#E36B6B' }}></i>
          </span>
          <span>Light → Heavy rain</span>
        </div>
      </div>

      <div className="mt-2 text-[11.5px] font-semibold text-muted flex flex-wrap justify-between items-center gap-2">
        <span>Radar: RainViewer HD · Basemaps: © CARTO / Esri / OpenStreetMap · Smart zoom lock enabled</span>
        <span className="text-[#8E7CC3]">Zoom snap: integer 1x (no pixel blur)</span>
      </div>
    </div>
  );
};
