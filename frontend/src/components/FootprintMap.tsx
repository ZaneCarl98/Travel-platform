/**
 * ============================================================
 *  (Check-in Footprint Globe)
 *
 * :
 * -  (Orthographic) 
 * - （）
 * -  →  + 
 * - ，
 * -  + 
 * - 
 * ============================================================
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Sphere,
  Graticule,
} from 'react-simple-maps';
import { geoCentroid, geoBounds } from 'd3-geo';
import type { Checkin } from '@/types/api';
import CityBoundaryLayer from '@/components/CityBoundaryLayer';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const GLOBE_SCALE_DEFAULT = 180;
const MAP_WIDTH = 800;
const MAP_HEIGHT = 500;
const ANIM_DURATION = 600;

interface FootprintMapProps {
  checkins: Checkin[];
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**  */
const calcCountryScale = (geo: any): number => {
  const bounds = geoBounds(geo);
  const [[west, south], [east, north]] = bounds;

  const lonSpan = Math.abs(east - west);
  const latSpan = Math.abs(north - south);
  const maxSpan = Math.max(lonSpan, latSpan);

  const countryName = geo.properties?.name as string | undefined;

  //  bounds ，
  if (countryName === 'France') return 3200;

  const targetAngle = maxSpan * 0.7;
  const radians = (targetAngle / 2) * (Math.PI / 180);
  const sinVal = Math.sin(radians);
  if (sinVal < 0.005) return 8000;
  const computed = Math.round(MAP_HEIGHT / 2 / sinVal);
  return Math.min(Math.max(computed, 500), 8000);
};

const FootprintMap = ({ checkins }: FootprintMapProps) => {
  const navigate = useNavigate();

  // Restore map state from sessionStorage (after navigating back from post/create)
  const savedState = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('footprintMapState');
      if (raw) {
        sessionStorage.removeItem('footprintMapState');
        return JSON.parse(raw) as {
          rotation?: [number, number, number];
          scale?: number;
          focusedCountry?: string | null;
        };
      }
    } catch {}
    return null;
  }, []);

  const [rotation, setRotation] = useState<[number, number, number]>(
    savedState?.rotation || [-104, -35, 0]
  );
  const [scale, setScale] = useState(savedState?.scale || GLOBE_SCALE_DEFAULT);
  const [focusedCountry, setFocusedCountry] = useState<string | null>(
    savedState?.focusedCountry || null
  );

  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const animRef = useRef<number | null>(null);

  const visitedCountries = useMemo(() => {
    const set = new Set<string>();
    checkins.forEach((c) => {
      if (c.city?.country) set.add(c.city.country);
    });
    return set;
  }, [checkins]);

  const citiesInFocused = useMemo(() => {
    if (!focusedCountry) return [];
    return checkins.filter((c) => c.city?.country === focusedCountry);
  }, [focusedCountry, checkins]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const animateTo = useCallback(
    (targetRotation: [number, number, number], targetScale: number) => {
      if (animRef.current) cancelAnimationFrame(animRef.current);

      const startRotation: [number, number, number] = [...rotation];
      const startScale = scale;
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const rawT = Math.min(elapsed / ANIM_DURATION, 1);
        const t = easeInOutCubic(rawT);

        setRotation([
          lerp(startRotation[0], targetRotation[0], t),
          lerp(startRotation[1], targetRotation[1], t),
          lerp(startRotation[2], targetRotation[2], t),
        ]);
        setScale(lerp(startScale, targetScale, t));

        if (rawT < 1) {
          animRef.current = requestAnimationFrame(tick);
        } else {
          animRef.current = null;
        }
      };

      animRef.current = requestAnimationFrame(tick);
    },
    [rotation, scale]
  );

  const handleCountryClick = useCallback(
    (geo: any) => {
      if (hasDragged.current) return;

      const countryName = geo.properties.name as string;

      if (focusedCountry === countryName) {
        setFocusedCountry(null);
        animateTo([-104, -35, 0], GLOBE_SCALE_DEFAULT);
        return;
      }

      // ，
      const MAINLAND_CENTERS: Record<string, [number, number]> = {
        France: [2.5, 46.5],
        Netherlands: [5.3, 52.1],
        Denmark: [9.5, 56.0],
        Norway: [10.0, 62.0],
      };
      const center = MAINLAND_CENTERS[countryName] || geoCentroid(geo);
      const [lon, lat] = center;
      const zoomScale = calcCountryScale(geo);

      setFocusedCountry(countryName);
      animateTo([-lon, -lat, 0], zoomScale);
    },
    [focusedCountry, animateTo]
  );

  const getEventPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    hasDragged.current = false;
    lastPos.current = getEventPos(e);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging.current || !lastPos.current) return;
      const pos = getEventPos(e);
      const dx = pos.x - lastPos.current.x;
      const dy = pos.y - lastPos.current.y;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        hasDragged.current = true;
      }

      lastPos.current = pos;

      const sensitivity = 0.4;
      setRotation((prev) => [
        prev[0] - dx * sensitivity,
        Math.max(-90, Math.min(90, prev[1] + dy * sensitivity)),
        prev[2],
      ]);
    },
    []
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    lastPos.current = null;
  }, []);

  /** ：→，→，sessionStorage */
  const handleCityClick = useCallback(
    (checkin: Checkin) => {
      // Save map state so Profile can restore it on back navigation
      sessionStorage.setItem('footprintMapState', JSON.stringify({
        rotation,
        scale,
        focusedCountry,
      }));
      if (checkin.post_id) {
        navigate(`/post/${checkin.post_id}`);
      } else {
        navigate(`/create?city=${encodeURIComponent(checkin.city?.name || '')}`);
      }
    },
    [navigate, rotation, scale, focusedCountry]
  );

  const handleZoomOut = useCallback(() => {
    setFocusedCountry(null);
    animateTo([-104, -35, 0], GLOBE_SCALE_DEFAULT);
  }, [animateTo]);

  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const isZoomed = focusedCountry !== null;


  return (
    <div
      className="relative w-full select-none overflow-hidden rounded-2xl"
      style={{
        background: 'radial-gradient(ellipse at center, #0d1f3c 0%, #060e1f 50%, #020810 100%)',
        cursor: isDragging.current ? 'grabbing' : 'grab',
      }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      {/*  */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.1,
              animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <ComposableMap
        projection="geoOrthographic"
        projectionConfig={{
          rotate: rotation,
          scale: scale,
        }}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        className="pointer-events-none h-auto w-full"
        style={{ maxHeight: '520px' }}
      >
        <defs>
          <filter id="cityGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="cityGlowLarge" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="cityGlowArea" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="markerGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#64d8ff" stopOpacity="1" />
            <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="markerGradientLarge" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.9" />
            <stop offset="20%" stopColor="#38bdf8" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.4" />
            <stop offset="80%" stopColor="#0284c7" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="oceanGradient" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#1a4a7a" />
            <stop offset="50%" stopColor="#123456" />
            <stop offset="100%" stopColor="#0a1e3d" />
          </radialGradient>
        </defs>

        <Sphere id="globe-sphere" fill="url(#oceanGradient)" stroke="#1e4976" strokeWidth={1.5} />
        <Graticule stroke="#1e3a5f" strokeWidth={0.3} strokeOpacity={0.4} />

        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryName = geo.properties.name as string;
              const isVisited = visitedCountries.has(countryName);
              const isFocused = focusedCountry === countryName;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => handleCountryClick(geo)}
                  style={{
                    default: {
                      fill: isFocused
                        ? '#3a9a7a'
                        : isVisited
                          ? '#2a6e5a'
                          : '#112520',
                      stroke: isFocused ? '#4ade80' : '#0f2b40',
                      strokeWidth: isFocused ? 1.5 : 0.5,
                      outline: 'none',
                    },
                    hover: {
                      fill: isFocused ? '#45b88d' : isVisited ? '#34866c' : '#182e28',
                      stroke: isFocused ? '#4ade80' : '#1a4060',
                      strokeWidth: isFocused ? 1.5 : 0.5,
                      outline: 'none',
                    },
                    pressed: {
                      fill: isVisited ? '#3a9a7a' : '#182e28',
                      outline: 'none',
                    },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* City boundary highlights (zoomed mode) */}
        <CityBoundaryLayer
          checkins={checkins}
          focusedCountry={focusedCountry}
          hoveredCity={hoveredCity}
          onCityClick={handleCityClick}
          onCityHover={setHoveredCity}
        />

        {/* City dot markers (non-zoomed mode only, NOT clickable) */}
        {checkins.map((checkin) =>
          checkin.city?.latitude != null && checkin.city?.longitude != null ? (
            <Marker
              key={checkin.id}
              coordinates={[checkin.city.longitude, checkin.city.latitude]}
            >
              {(!isZoomed || checkin.city?.country !== focusedCountry) && (
                <>
                  <circle
                    r={10}
                    fill="url(#markerGradient)"
                    opacity={0.5}
                    filter="url(#cityGlow)"
                  >
                    <animate
                      attributeName="r"
                      values="8;12;8"
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.3;0.6;0.3"
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r={5} fill="#38bdf8" opacity={0.6} />
                  <circle
                    r={3}
                    fill="#7dd3fc"
                    stroke="#bae6fd"
                    strokeWidth={1}
                    opacity={0.9}
                  />
                </>
              )}
            </Marker>
          ) : null
        )}
      </ComposableMap>

      {/*  */}
      {isZoomed && (
        <button
          onClick={handleZoomOut}
          className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-sky-400/30 px-4 py-2 text-sm font-medium text-sky-200 transition-all hover:border-sky-400/60 hover:text-sky-100"
          style={{ background: 'rgba(6, 14, 31, 0.8)', backdropFilter: 'blur(8px)' }}
        >
          ← Back to Globe
        </button>
      )}

      {/*  */}
      {isZoomed && (
        <div
          className="absolute right-4 top-4 rounded-full border border-sky-400/30 px-4 py-2 text-sm font-semibold text-sky-200"
          style={{ background: 'rgba(6, 14, 31, 0.8)', backdropFilter: 'blur(8px)' }}
        >
          📍 {focusedCountry}
          {citiesInFocused.length > 0 && (
            <span className="ml-2 text-sky-400">
              · {citiesInFocused.length} check-in{citiesInFocused.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/*  */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs text-sky-300/70"
        style={{ background: 'rgba(6, 14, 31, 0.6)', backdropFilter: 'blur(4px)' }}
      >
        {isZoomed
          ? '🔍 Click highlighted cities to view or create posts · Click country again or "Back" to zoom out'
          : '🌍 Drag to rotate · Click a country to zoom in'}
      </div>

      {/*  */}
      <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-5 text-xs text-sky-200/60">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#2a6e5a' }} />
          Visited Country
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative inline-block h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_2px_rgba(56,189,248,0.5)]" />
          Check-in City
        </div>
      </div>
    </div>
  );
};

export default FootprintMap;
