const WEATHER_CACHE_PREFIX = 'legendink_weather_';
const WEATHER_ALL_CACHE_PREFIX = 'legendink_weather_all_';
const WEATHER_CACHE_MS = 6 * 60 * 60 * 1000; // 6 hours

interface WeatherCache {
  data: unknown;
  timestamp: number;
}

export interface LiveWeather {
  province: string;
  city: string;
  adcode: string;
  weather: string;
  temperature: string;
  winddirection: string;
  windpower: string;
  humidity: string;
  reporttime: string;
}

export interface Cast {
  date: string;
  week: string;
  dayweather: string;
  nightweather: string;
  daytemp: string;
  nighttemp: string;
  daywind: string;
  nightwind: string;
  daypower: string;
  nightpower: string;
}

export interface Forecast {
  city: string;
  adcode: string;
  province: string;
  reporttime: string;
  casts: Cast[];
}

export interface WeatherAll {
  lives: LiveWeather[];
  forecasts: Forecast[];
}

function requestWeatherJsonp(adcode: string, extensions: 'base' | 'all' = 'base'): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const callbackId = '__amap_weather_cb_' + Date.now();
    const scriptId = 'amap-weather-script-' + extensions;

    const existing = document.getElementById(scriptId);
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    (window as any)[callbackId] = (data: unknown) => {
      cleanup();
      resolve(data);
    };

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://restapi.amap.com/v3/weather/weatherInfo?city=${adcode}&extensions=${extensions}&key=0113a13c88697dcea6a445584d535837&callback=${callbackId}`;

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('timeout'));
    }, 5000);

    function cleanup() {
      clearTimeout(timeout);
      delete (window as any)[callbackId];
      const s = document.getElementById(scriptId);
      if (s && s.parentNode) s.parentNode.removeChild(s);
    }

    script.onerror = () => {
      cleanup();
      reject(new Error('script error'));
    };

    document.head.appendChild(script);
  });
}

export async function getWeather(adcode: string): Promise<{ weather: string; temperature: string } | null> {
  if (!adcode) return null;
  const cacheKey = WEATHER_CACHE_PREFIX + adcode;

  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const cached = JSON.parse(raw) as WeatherCache;
      if (Date.now() - cached.timestamp < WEATHER_CACHE_MS) {
        return cached.data as { weather: string; temperature: string };
      }
    }
  } catch {
    // ignore
  }

  try {
    const data = (await requestWeatherJsonp(adcode)) as {
      status?: string;
      lives?: Array<{ weather?: string; temperature?: string }>;
    };
    if (data.status !== '1' || !data.lives || data.lives.length === 0) return null;
    const live = data.lives[0];
    const simplified = {
      weather: live.weather || '',
      temperature: live.temperature || '',
    };
    const cache: WeatherCache = { data: simplified, timestamp: Date.now() };
    localStorage.setItem(cacheKey, JSON.stringify(cache));
    return simplified;
  } catch {
    return null;
  }
}

export async function getWeatherAll(adcode: string): Promise<WeatherAll | null> {
  if (!adcode) return null;
  const cacheKey = WEATHER_ALL_CACHE_PREFIX + adcode;

  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const cached = JSON.parse(raw) as WeatherCache;
      if (Date.now() - cached.timestamp < WEATHER_CACHE_MS) {
        return cached.data as WeatherAll;
      }
    }
  } catch {
    // ignore
  }

  try {
    const data = (await requestWeatherJsonp(adcode, 'all')) as {
      status?: string;
      lives?: LiveWeather[];
      forecasts?: Forecast[];
    };
    if (data.status !== '1') return null;
    const result: WeatherAll = {
      lives: data.lives || [],
      forecasts: data.forecasts || [],
    };
    const cache: WeatherCache = { data: result, timestamp: Date.now() };
    localStorage.setItem(cacheKey, JSON.stringify(cache));
    return result;
  } catch {
    return null;
  }
}
