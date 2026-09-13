import { OVERLAY_PAIRS, EVENT_ONLY } from './resorts.mjs';
import { overlayIndex, nameKey, fmt } from './windows.mjs';

const PAIR = overlayIndex(OVERLAY_PAIRS);
const EVENTS_ONLY = new Set(EVENT_ONLY);
const overlaps = (a, b) => a.start <= b.end && b.start <= a.end;

export function diffWindows(prevWins, curWins, prevHz, curHz) {
  const ev = [];
  const usedPrev = new Set();
  const openEnded = (w, hz) => hz && w.end >= hz.last;
  const inPrevView = d => prevHz && d >= prevHz.first && d <= prevHz.last;

  for (const w of curWins) {
    const cands = prevWins.filter((p, i) =>
      !usedPrev.has(i) && p.resort === w.resort && p.id === w.id &&
      p.type === w.type && overlaps(p, w));
    const p = cands[0];
    if (p) {
      usedPrev.add(prevWins.indexOf(p));
      if (w.start < p.start && inPrevView(w.start))
        ev.push({ kind: 'STARTS EARLIER', window: w, prev: p });
      if (w.end > p.end && !openEnded(p, prevHz))
        ev.push({ kind: 'EXTENDED', window: w, prev: p });
      if (w.end < p.end && !openEnded(w, curHz))
        ev.push({ kind: 'SHORTENED', window: w, prev: p });
      continue;
    }
    ev.push({
      kind: inPrevView(w.start) ? 'NEW CLOSURE' : 'ENTERED THE WINDOW',
      window: w, prev: null
    });
  }

  for (let i = 0; i < prevWins.length; i++) {
    if (usedPrev.has(i)) continue;
    const p = prevWins[i];
    if (!curHz || p.end < curHz.first) continue;
    ev.push({ kind: 'REOPENED', window: p, prev: p });
  }

  return tagOverlays(ev).filter(e => !EVENTS_ONLY.has(nameKey(e.window.name)));
}

function tagOverlays(ev) {
  for (const a of ev) {
    const partner = PAIR.get(nameKey(a.window.name));
    if (!partner) continue;
    const b = ev.find(x => x !== a && nameKey(x.window.name) === partner &&
      x.window.resort === a.window.resort &&
      (x.window.start === a.window.start || x.window.end === a.window.end ||
       overlaps(x.window, a.window)));
    if (b) { a.note = 'seasonal overlay swap'; b.note = 'seasonal overlay swap'; }
  }
  return ev;
}

export const line = e =>
  `${e.kind}: ${e.window.name} (${e.window.park}) — ${e.window.type} ${fmt(e.window)}` +
  (e.prev && e.kind !== 'REOPENED' ? ` [was ${fmt(e.prev)}]` : '') +
  (e.note ? ` — ${e.note}` : '');
