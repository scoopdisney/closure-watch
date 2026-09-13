import { norm } from './resorts.mjs';

export const KEY = r => `${r.resort}|${r.id}|${r.type}`;

const next = d => new Date(new Date(d + 'T12:00:00Z').getTime() + 86400000)
  .toISOString().slice(0, 10);

export function buildWindows(rows) {
  const by = new Map();
  for (const r of rows) {
    const k = KEY(r);
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(r);
  }
  const out = [];
  for (const [, list] of by) {
    list.sort((a, b) => a.date < b.date ? -1 : 1);
    let cur = null;
    for (const r of list) {
      if (cur && next(cur.end) === r.date) { cur.end = r.date; cur.days++; continue; }
      if (cur) out.push(cur);
      cur = { resort: r.resort, id: r.id, name: r.name, park: r.park,
              type: r.type, start: r.date, end: r.date, days: 1 };
    }
    if (cur) out.push(cur);
  }
  out.sort((a, b) => (a.start + a.resort + a.name) < (b.start + b.resort + b.name) ? -1 : 1);
  return out;
}

export function horizonOf(days) {
  const ok = days
    .filter(d => d.entities > 0 && d.scheduled >= d.entities * 0.2)
    .map(d => d.date).sort();
  return ok.length ? { first: ok[0], last: ok[ok.length - 1] } : null;
}

export const fmt = w => w.start === w.end ? w.start : `${w.start} to ${w.end}`;

export function overlayIndex(pairs) {
  const m = new Map();
  for (const [a, b] of pairs) { m.set(a, b); m.set(b, a); }
  return m;
}

export const nameKey = n => norm(n);
