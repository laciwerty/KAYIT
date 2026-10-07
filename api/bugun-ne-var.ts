// Vercel Serverless Function: /api/bugun-ne-var
// Works out of the box on https://[your-app].vercel.app/api/bugun-ne-var

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

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');

  let offset = 0;
  if (req.query?.gun === 'yarin' || req.query?.offset === '1') {
    offset = 1;
  }

  const { dateStr, isWeekend, dayName } = getTurkeyDate(offset);
  const dayPrefix = offset === 1 ? 'Yarın' : 'Bugün';

  if (!req.query?.tarih && isWeekend) {
    return res.status(200).send(`${dayPrefix} hafta sonu (${dayName}), yemekhane kapalı.`);
  }

  // Check query parameter for menu or fallback message
  const customMenu = req.query?.menu as string;
  if (customMenu) {
    return res.status(200).send(formatMenuToSpokenSentence(customMenu, dayPrefix));
  }

  return res.status(200).send(`Bugün (${dayName}) yemekhane servisi aktif. Güncel menünüz takviminizden otomatik seslendirilir.`);
}
