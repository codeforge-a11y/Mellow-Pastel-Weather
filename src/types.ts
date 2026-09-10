export interface PlaceLocation {
  lat: number;
  lon: number;
  name: string;
  country: string;
  cc: string;
  admin?: string;
}

export interface FavoritePlace extends PlaceLocation {
  t?: number;
}

export interface CurrentWeather {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  is_day: number;
  precipitation: number;
  weather_code: number;
  description: string;
  cloud_cover: number;
  pressure_msl: number;
  surface_pressure: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  visibility: number | null;
  uv_index: number | null;
}

export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  dew_point_2m: number[];
  apparent_temperature: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
  description: string[];
  cloud_cover: number[];
  pressure_msl: number[];
  visibility: (number | null)[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
  wind_gusts_10m: number[];
  uv_index: (number | null)[];
  is_day: number[];
}

export interface DailyWeather {
  time: string[];
  weather_code: number[];
  description: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  daylight_duration: number[];
  uv_index_max: (number | null)[];
  precipitation_probability_max: number[];
  precipitation_sum: number[];
  wind_speed_10m_max: number[];
  wind_gusts_10m_max: number[];
  wind_direction_10m_dominant: number[];
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
}

export interface AirQualityData {
  aqi?: number;
  components: {
    co?: number;
    no?: number;
    no2?: number;
    o3?: number;
    so2?: number;
    pm2_5?: number;
    pm10?: number;
    nh3?: number;
  };
}

export interface WeatherAlert {
  id?: string;
  sev: 'extreme' | 'severe' | 'moderate';
  title: string;
  desc: string;
  icon?: string;
  area?: string;
  inst?: string;
}

export interface RadarFrame {
  time: number;
  path: string;
}
