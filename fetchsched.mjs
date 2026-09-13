const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const HEADERS = {
  'User-Agent': UA,
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9'
};

const CLOSED_TYPES = new Set(['Refurbishment', 'Closed']);

export function isoDates(startISO, days) {
  const out = [];
  const d = new Date(startISO + 'T12:00:00Z');
  for (let i = 0; i < days; i++) {
    out.push(new Date(d.getTime() + i * 86400000).toISOString().slice(0, 10));
  }
  return out;
}

export async function fetchDate(resort, date, tries = 3) {
  const url = `https://${resort.host}/finder/api/v1/explorer-service/` +
    `list-ancestor-entities/${resort.key.toLowerCase()}/${resort.dest};` +
    `entityType=destination/${date}/attractions`;
  let last = '';
  for (let t = 0; t < tries; t++) {
    try {
      const r = await fetch(url, { headers: HEADERS });
      if (!r.ok) { last = 'HTTP ' + r.status; continue; }
      const txt = await r.text();
      if (txt[0] !== '{') { last = 'not JSON'; continue; }
      return parseDate(resort, date, JSON.parse(txt));
    } catch (e) { last = String(e.message || e); }
    await new Promise(s => setTimeout(s, 1500 * (t + 1)));
  }
  throw new Error(`${resort.key} ${date}: ${last}`);
}

function parseDate(resort, date, j) {
  const res = j.results || [];
  const rows = [];
  let scheduled = 0;
  for (const e of res) {
    const sch = (e.schedule && e.schedule.schedules) || [];
    if (sch.length) scheduled++;
    for (const s of sch) {
      if (!CLOSED_TYPES.has(s.type)) continue;
      rows.push({
        resort: resort.key,
        id: String(e.id || '').split(';')[0],
        name: (e.name || '').trim(),
        park: e.locationName || '',
        date,
        type: s.type
      });
      break;
    }
  }
  return { resort: resort.key, date, entities: res.length, scheduled, rows };
}
