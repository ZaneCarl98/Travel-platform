import { Marker } from 'react-simple-maps';
import type { Checkin } from '@/types/api';

interface CityBoundaryLayerProps {
  checkins: Checkin[];
  focusedCountry: string | null;
  hoveredCity: string | null;
  onCityClick: (checkin: Checkin) => void;
  onCityHover: (cityName: string | null) => void;
}

const fallbackCoordinates: Record<string, [number, number]> = {
  Glasgow: [-4.2518, 55.8642],
  London: [-0.1276, 51.5072],
  Paris: [2.3522, 48.8566],
  Tokyo: [139.6917, 35.6895],
  Shanghai: [121.4737, 31.2304],
};

const getCityCoordinates = (checkin: Checkin): [number, number] | null => {
  const city = checkin.city;
  if (!city) return null;

  if (city.latitude != null && city.longitude != null) {
    return [city.longitude, city.latitude];
  }

  return fallbackCoordinates[city.name] || null;
};

const CityBoundaryLayer = ({
  checkins,
  focusedCountry,
  hoveredCity,
  onCityClick,
  onCityHover,
}: CityBoundaryLayerProps) => {
  if (!focusedCountry) return null;

  const focusedCheckins = checkins.filter((c) => c.city?.country === focusedCountry);

  return (
    <>
      {focusedCheckins.map((checkin) => {
        const cityName = checkin.city?.name;
        if (!cityName) return null;

        const coordinates = getCityCoordinates(checkin);
        if (!coordinates) return null;

        const isHovered = hoveredCity === cityName;

        return (
          <Marker
            key={checkin.id}
            coordinates={coordinates}
            onMouseEnter={() => onCityHover(cityName)}
            onMouseLeave={() => onCityHover(null)}
            onClick={() => onCityClick(checkin)}
          >
            <g className="cursor-pointer">
              <circle
                r={isHovered ? 16 : 12}
                fill="#38bdf8"
                opacity={0.18}
              >
                <animate
                  attributeName="r"
                  values={isHovered ? '14;18;14' : '10;14;10'}
                  dur="1.8s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.15;0.35;0.15"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </circle>

              <circle
                r={isHovered ? 8 : 6}
                fill="#38bdf8"
                stroke="#e0f2fe"
                strokeWidth={2}
              />

              <text
                y={-16}
                textAnchor="middle"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  fill: '#bae6fd',
                  textShadow: '0 0 8px #38bdf8',
                  pointerEvents: 'none',
                }}
              >
                {cityName}
              </text>
            </g>
          </Marker>
        );
      })}
    </>
  );
};

export default CityBoundaryLayer;