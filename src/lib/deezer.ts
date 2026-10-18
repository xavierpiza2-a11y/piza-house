export interface DeezerTrack {
  id: number;
  title: string;
  title_short?: string;
  artist: {
    id: number;
    name: string;
  };
  album: {
    id: number;
    title: string;
    cover_small: string;
    cover_medium?: string;
  };
}

export function extractDeezerTrackId(url: string): string | null {
  const m = (url || '').match(/track\/(\d+)/);
  return m ? m[1] : null;
}

export async function searchDeezer(query: string): Promise<DeezerTrack[]> {
  if (!query || !query.trim()) return [];

  // Try secure backend proxy first
  try {
    const res = await fetch(`/api/music/search?q=${encodeURIComponent(query.trim())}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.data)) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('[DEEZER] Server proxy fetch error, attempting fallback:', err);
  }

  // Fallback to JSONP in case backend proxy is not reachable
  return new Promise((resolve) => {
    const cb = 'dz_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const s = document.createElement('script');
    s.src = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=10&output=jsonp&callback=${cb}`;

    const timer = setTimeout(() => {
      s.remove();
      delete (window as any)[cb];
      resolve([]);
    }, 5000);

    (window as any)[cb] = (data: any) => {
      clearTimeout(timer);
      s.remove();
      delete (window as any)[cb];
      resolve(data?.data || []);
    };

    document.head.appendChild(s);
  });
}
