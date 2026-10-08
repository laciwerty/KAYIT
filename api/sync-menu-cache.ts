import fs from 'fs';
import path from 'path';

// Serverless memory cache
let globalMemoryCache: Record<string, string> = {};

export function getCachedMenu(dateStr: string): string | null {
  // 1. Check memory cache
  if (globalMemoryCache[dateStr]) {
    return globalMemoryCache[dateStr];
  }

  // 2. Check /tmp/menu-cache.json (writable on Vercel)
  try {
    const tmpPath = '/tmp/menu-cache.json';
    if (fs.existsSync(tmpPath)) {
      const raw = fs.readFileSync(tmpPath, 'utf-8');
      const parsed = JSON.parse(raw);
      globalMemoryCache = { ...globalMemoryCache, ...parsed };
      if (globalMemoryCache[dateStr]) {
        return globalMemoryCache[dateStr];
      }
    }
  } catch (e) {}

  // 3. Check bundled data/menu-cache.json
  try {
    const bundlePaths = [
      path.join(process.cwd(), 'data', 'menu-cache.json'),
      path.join(__dirname, '..', 'data', 'menu-cache.json'),
      path.join(__dirname, 'menu-cache.json'),
    ];

    for (const bPath of bundlePaths) {
      if (fs.existsSync(bPath)) {
        const raw = fs.readFileSync(bPath, 'utf-8');
        const parsed = JSON.parse(raw);
        globalMemoryCache = { ...globalMemoryCache, ...parsed };
        if (globalMemoryCache[dateStr]) {
          return globalMemoryCache[dateStr];
        }
      }
    }
  } catch (e) {}

  return null;
}

export function saveMenuToCache(menuMap: Record<string, string>) {
  if (!menuMap || typeof menuMap !== 'object') return;
  globalMemoryCache = { ...globalMemoryCache, ...menuMap };

  // Write to /tmp
  try {
    fs.writeFileSync('/tmp/menu-cache.json', JSON.stringify(globalMemoryCache, null, 2), 'utf-8');
  } catch (e) {}

  // Write to data directory if writable
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(dataDir, 'menu-cache.json'), JSON.stringify(globalMemoryCache, null, 2), 'utf-8');
  } catch (e) {}
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { menuMap } = req.body || {};
      if (menuMap && typeof menuMap === 'object') {
        saveMenuToCache(menuMap);
      }
      return res.status(200).json({ success: true, count: Object.keys(globalMemoryCache).length });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(200).json({ count: Object.keys(globalMemoryCache).length });
}
