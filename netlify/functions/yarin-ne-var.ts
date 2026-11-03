const APP_STORAGE_KEY = 'zjs31ezo';

function getTurkeyDate(offsetDays: number = 1): { dateStr: string; isWeekend: boolean; dayName: string } {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + offsetDays);

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

function formatMenuToSpokenSentence(menuText: string, dayPrefix: string = 'Yarın'): string {
  if (!menuText || !menuText.trim()) return '';

  const cleanText = menuText.trim();
  if (cleanText.toLowerCase().includes('tatil')) {
    return `${dayPrefix} yemekhane resmi tatil nedeniyle kapalı.`;
  }

  const items = cleanText.split(/[,–\n]+/).map((s) => s.trim()).filter(Boolean);

  if (items.length === 0) {
    return `${dayPrefix} yemekhanede: ${cleanText} var.`;
  }

  if (items.length === 1) {
    return `${dayPrefix} yemekhanede: ${items[0]} var. Afiyet olsun!`;
  }

  const allExceptLast = items.slice(0, -1).join(', ');
  const lastItem = items[items.length - 1];
  return `${dayPrefix} yemekhanede: ${allExceptLast} ve ${lastItem} var. Afiyet olsun!`;
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const { dateStr, isWeekend, dayName } = getTurkeyDate(1);
  const dayPrefix = 'Yarın';

  const headers = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*',
  };

  if (!url.searchParams.get('tarih') && isWeekend) {
    return new Response(`${dayPrefix} hafta sonu (${dayName}), yemekhane kapalı.`, { headers });
  }

  let menuText = url.searchParams.get('menu');

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
    return new Response(formatMenuToSpokenSentence(menuText, dayPrefix), { headers });
  }

  return new Response(`${dayPrefix} için (${dayName}) yemekhane menüsü henüz sisteme girilmemiş.`, { headers });
};
