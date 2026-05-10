const LOCATION_KEY = 'legendink_location';
const CACHE_MS = 6 * 60 * 60 * 1000; // 6 hours

interface LocationCache {
  data: unknown;
  timestamp: number;
}

function requestJsonp(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const callbackId = '__amap_cb_' + Date.now();
    const scriptId = 'amap-location-script';

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
    script.src = `https://restapi.amap.com/v3/ip?key=0113a13c88697dcea6a445584d535837&callback=${callbackId}`;

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

export async function getLocation(): Promise<unknown | null> {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as LocationCache;
      if (Date.now() - cached.timestamp < CACHE_MS) {
        return cached.data;
      }
    }
  } catch {
    // ignore invalid cache
  }

  try {
    const data = (await requestJsonp()) as { status?: string; province?: string; city?: string; adcode?: string };
    if (data.status !== '1') return null;
    const simplified = {
      province: data.province || '',
      city: data.city || '',
      adcode: data.adcode || '',
    };
    const cache: LocationCache = { data: simplified, timestamp: Date.now() };
    localStorage.setItem(LOCATION_KEY, JSON.stringify(cache));
    return simplified;
  } catch {
    return null;
  }
}
