const APP_STORAGE_KEY = 'zjs31ezo';

function getTurkeyDate(offsetDays: number = 0): { dateStr: string; isWeekend: boolean; dayName: string } {
  const targetDate = new Date();
  if (offsetDays !== 0) {
    targetDate.setDate(targetDate.getDate() + offsetDays);
  }

  const dateStr = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(targetDate);

  const dayName = new Intl.DateTimeFormat('tr-TR', { 
    timeZone: 'Europe/Istanbul', 
    weekday: 'long' 
  }).format(targetDate);

  const dayOfWeekCode = new Intl.DateTimeFormat('en-US', { 
    timeZone: 'Europe/Istanbul', 
    weekday: 'short' 
  }).format(targetDate);
  const isWeekend = dayOfWeekCode === 'Sat' || dayOfWeekCode === 'Sun';

  return { dateStr, isWeekend, dayName };
}

function formatMenuToSpokenSentence(menuText: string, dayPrefix: string = 'Bugün'): string {
  if (!menuText || !menuText.trim()) return '';

  const cleanText = menuText.trim();
  if (cleanText.toLowerCase().includes('tatil')) {
    return `${dayPrefix} yemekhane resmi tatil nedeniyle kapalı.`;
  }

  const items = cleanText.split(/[,–\n]+/).map((s) => s.trim()).filter(Boolean);
  if (items.length === 0) return `${dayPrefix} yemekhanede: ${cleanText} var.`;
  if (items.length === 1) return `${dayPrefix} yemekhanede: ${items[0]} var. Afiyet olsun!`;

  const allExceptLast = items.slice(0, -1).join(', ');
  const lastItem = items[items.length - 1];
  return `${dayPrefix} yemekhanede: ${allExceptLast} ve ${lastItem} var. Afiyet olsun!`;
}

async function getSpeechResponse(offsetQuery?: string | null, customMenu?: string | null, isTarihSet?: boolean): Promise<string> {
  let offset = 0;
  if (offsetQuery === 'yarin' || offsetQuery === '1') {
    offset = 1;
  }

  const { dateStr, isWeekend, dayName } = getTurkeyDate(offset);
  const dayPrefix = offset === 1 ? 'Yarın' : 'Bugün';

  if (!isTarihSet && isWeekend) {
    return `${dayPrefix} hafta sonu (${dayName}), yemekhane kapalı.`;
  }

  let menuText = customMenu;
  if (!menuText) {
    try {
      const cloudRes = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/GetValue/${APP_STORAGE_KEY}/${dateStr}`);
      if (cloudRes.ok) {
        const val = await cloudRes.json();
        if (val && typeof val === 'string') {
          menuText = Buffer.from(val, 'base64').toString('utf-8');
        }
      }
    } catch (e) {}
  }

  if (menuText && menuText.trim()) {
    return formatMenuToSpokenSentence(menuText, dayPrefix);
  }

  return `${dayPrefix} için (${dayName}) yemekhane menüsü henüz sisteme girilmemiş.`;
}

// Netlify Functions v2 (Standard Web Request)
export default async (req: Request) => {
  const url = new URL(req.url);
  const offsetQuery = url.searchParams.get('gun') || url.searchParams.get('offset');
  const customMenu = url.searchParams.get('menu');
  const isTarihSet = Boolean(url.searchParams.get('tarih'));

  const text = await getSpeechResponse(offsetQuery, customMenu, isTarihSet);

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

// Netlify Functions v1 (Classic AWS Lambda style fallback)
export const handler = async (event: any) => {
  const params = event.queryStringParameters || {};
  const offsetQuery = params.gun || params.offset;
  const customMenu = params.menu;
  const isTarihSet = Boolean(params.tarih);

  const text = await getSpeechResponse(offsetQuery, customMenu, isTarihSet);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
    body: text,
  };
};

export const config = {
  path: '/api/bugun-ne-var',
};
