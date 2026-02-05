const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5164';
const CACHE_KEY_PREFIX = 'paibot_translations_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedTranslations {
  data: Record<string, unknown>;
  timestamp: number;
}

function getCacheKey(locale: string): string {
  return `${CACHE_KEY_PREFIX}${locale}`;
}

function getFromCache(locale: string): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(getCacheKey(locale));
    if (!cached) return null;

    const { data, timestamp }: CachedTranslations = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_TTL_MS;

    if (isExpired) {
      localStorage.removeItem(getCacheKey(locale));
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function setToCache(locale: string, data: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  try {
    const cacheEntry: CachedTranslations = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(getCacheKey(locale), JSON.stringify(cacheEntry));
  } catch {
    // localStorage might be full or disabled
  }
}

export async function fetchTranslations(locale: string): Promise<Record<string, unknown> | null> {
  // Check cache first
  const cached = getFromCache(locale);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/AmgCommon/translations/${locale}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      console.warn(`Failed to fetch translations for ${locale}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Cache the result
    setToCache(locale, data);

    return data;
  } catch (error) {
    console.warn('Error fetching translations:', error);
    return null;
  }
}

export function clearTranslationCache(locale?: string): void {
  if (typeof window === 'undefined') return;

  if (locale) {
    localStorage.removeItem(getCacheKey(locale));
  } else {
    // Clear all translation caches
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
}
