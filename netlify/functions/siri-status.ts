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

export default async (req: Request) => {
  const { dateStr, isWeekend, dayName } = getTurkeyDate(0);

  let speech = '';
  let hasMenu = false;

  if (isWeekend) {
    speech = `Bugün hafta sonu (${dayName}), yemekhane kapalı.`;
  } else {
    // Try fetching today's menu from cloud store
    try {
      const cloudRes = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/GetValue/${APP_STORAGE_KEY}/${dateStr}`);
      if (cloudRes.ok) {
        const val = await cloudRes.json();
        if (val && typeof val === 'string') {
          const decoded = Buffer.from(val, 'base64').toString('utf-8');
          if (decoded && decoded.trim()) {
            speech = formatMenuToSpokenSentence(decoded, 'Bugün');
            hasMenu = true;
          }
        }
      }
    } catch (e) {}

    if (!speech) {
      speech = `Bugün (${dayName}) yemekhane servisi aktif.`;
    }
  }

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  };

  return new Response(
    JSON.stringify({
      success: true,
      todayDate: dateStr,
      dayName,
      isWeekend,
      hasMenu,
      speechText: speech,
      totalCachedDays: 30,
    }),
    { headers }
  );
};
