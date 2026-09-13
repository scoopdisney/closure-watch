import { fmt, nameKey } from './windows.mjs';
import { EVENT_ONLY } from './resorts.mjs';
import { line } from './diff.mjs';

const ORDER = ['NEW CLOSURE', 'EXTENDED', 'STARTS EARLIER', 'SHORTENED',
               'REOPENED', 'ENTERED THE WINDOW'];
const rank = k => { const i = ORDER.indexOf(k); return i < 0 ? 99 : i; };

export function report(stamp, resorts, events, curWins, hz, failures) {
  const L = [];
  L.push(`## Closure watch — ${stamp} UTC`);
  L.push('');
  const counts = resorts.map(r =>
    `${r.key} ${r.entities} entities, ${r.closures} closure-days, window to ${hz[r.key] ? hz[r.key].last : 'n/a'}`);
  L.push(`**Counts:** ${counts.join(' · ')} · ${failures.length} failure(s)`);
  L.push('');

  const real = events.filter(e => !e.note);
  const noise = events.filter(e => e.note);

  if (!real.length) L.push('**No changes.** Nothing moved on either calendar since the last run.');
  else {
    L.push(`**${real.length} change(s):**`);
    L.push('');
    real.sort((a, b) => rank(a.kind) - rank(b.kind) ||
      (a.window.start < b.window.start ? -1 : 1));
    for (const e of real) L.push(`- ${e.window.resort} — ${line(e)}`);
  }
  if (noise.length) {
    L.push('');
    L.push('<details><summary>Suppressed as seasonal overlay swaps</summary>');
    L.push('');
    for (const e of noise) L.push(`- ${e.window.resort} — ${line(e)}`);
    L.push('');
    L.push('</details>');
  }

  L.push('');
  L.push('<details><summary>Everything currently down</summary>');
  L.push('');
  const ev = new Set(EVENT_ONLY);
  const shown = curWins.filter(w => !ev.has(nameKey(w.name)));
  const hidden = curWins.length - shown.length;
  for (const w of shown) {
    const open = hz[w.resort] && w.end >= hz[w.resort].last ? ' (no end date published)' : '';
    L.push(`- ${w.resort} — ${w.name} (${w.park}) — ${w.type} ${fmt(w)}${open}`);
  }
  if (hidden) L.push(`- (${hidden} hard-ticket-event dates omitted: ${EVENT_ONLY.join(', ')})`);
  L.push('');
  L.push('</details>');
  if (failures.length) {
    L.push('');
    L.push('**Failures:** ' + failures.join(' · '));
  }
  return L.join('\n') + '\n';
}
