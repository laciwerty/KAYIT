const APP_STORAGE_KEY = 'zjs31ezo';

function encodeBase64Url(str: string): string {
  try {
    const b64 = Buffer.from(str, 'utf-8').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    return '';
  }
}

export default async (req: Request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json() as any;
      const menuMap = body?.menuMap || {};

      const promises = Object.entries(menuMap).map(async ([date, menuText]) => {
        if (!menuText || !date) return;
        const b64 = encodeBase64Url(menuText as string);
        const saveUrl = `https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${APP_STORAGE_KEY}/${date}/${b64}`;
        await fetch(saveUrl, { method: 'POST' }).catch(() => {});
      });

      await Promise.allSettled(promises);
      return new Response(JSON.stringify({ success: true, count: Object.keys(menuMap).length }), { headers });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  }

  return new Response(JSON.stringify({ status: 'ready' }), { headers });
};
