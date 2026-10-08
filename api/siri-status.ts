// Vercel Serverless Function: /api/siri-status

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

export default async function handler(req: any, res: any) {
  const { dateStr, isWeekend, dayName } = getTurkeyDate(0);

  let speech = '';
  if (isWeekend) {
    speech = `Bugün hafta sonu (${dayName}), yemekhane kapalı.`;
  } else {
    speech = `Bugün (${dayName}) yemekhane servisi aktif. Güncel menü takvimden seslendirilir.`;
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    success: true,
    todayDate: dateStr,
    dayName,
    isWeekend,
    hasMenu: true,
    speechText: speech,
    totalCachedDays: 30,
  });
}
