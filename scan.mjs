import fs from 'node:fs';
import path from 'node:path';
import { RESORTS } from './resorts.mjs';
import { isoDates, fetchDate } from './fetchsched.mjs';
import { buildWindows, horizonOf } from './windows.mjs';
import { diffWindows } from './diff.mjs';
import { toCSV, fromCSV, CLOSURE_COLS, HORIZON_COLS } from './csv.mjs';
import { report } from './report.mjs';

const DAYS = Number(process.env.DAYS || 30);
const DIR = 'data';
const CLOSURES = path.join(DIR, 'closures.csv');
const HORIZON = path.join(DIR, 'horizon.csv');
const LOG = path.join(DIR, 'closure-log.csv');
const OUT = 'summary.md';
const MIN_OK = Number(process.env.MIN_OK || 0.8);

const read = f => fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
const today = new Date().toISOString().slice(0, 10);
const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

const prevRows = fromCSV(read(CLOSURES));
const prevDays = fromCSV(read(HORIZON)).map(d => ({
  ...d, entities: +d.entities, scheduled: +d.scheduled
}));

const curRows = [], curDays = [], failures = [], summary = [];

for (const resort of RESORTS) {
  const dates = isoDates(today, DAYS);
  let ok = 0, closures = 0, entities = 0;
  for (const date of dates) {
    try {
      const r = await fetchDate(resort, date);
      ok++; closures += r.rows.length; entities = Math.max(entities, r.entities);
      curRows.push(...r.rows);
      curDays.push({ resort: r.resort, date: r.date, entities: r.entities, scheduled: r.scheduled });
    } catch (e) { failures.push(String(e.message || e)); }
    await new Promise(s => setTimeout(s, 250));
  }
  if (ok < dates.length * MIN_OK) {
    console.error(`ABORT ${resort.key}: only ${ok}/${dates.length} dates fetched`);
    process.exit(1);
  }
  summary.push({ key: resort.key, entities, closures });
  console.log(`${resort.key} ${ok}/${dates.length} dates · ${entities} entities · ${closures} closure-days`);
}

const hz = {}, prevHz = {};
for (const r of RESORTS) {
  hz[r.key] = horizonOf(curDays.filter(d => d.resort === r.key));
  prevHz[r.key] = horizonOf(prevDays.filter(d => d.resort === r.key));
}

const curWins = buildWindows(curRows);
const prevWins = buildWindows(prevRows);
let events = [];
if (prevRows.length || prevDays.length) {
  for (const r of RESORTS) {
    events = events.concat(diffWindows(
      prevWins.filter(w => w.resort === r.key),
      curWins.filter(w => w.resort === r.key),
      prevHz[r.key], hz[r.key]));
  }
} else {
  console.log('BASELINE RUN — no previous snapshot, no diff');
}

fs.mkdirSync(DIR, { recursive: true });
fs.writeFileSync(CLOSURES, toCSV(CLOSURE_COLS, curRows));
fs.writeFileSync(HORIZON, toCSV(HORIZON_COLS, curDays));

const logged = fromCSV(read(LOG));
for (const e of events.filter(x => !x.note)) {
  logged.push({ detected: today, resort: e.window.resort, name: e.window.name,
    park: e.window.park, type: e.window.type, kind: e.kind,
    start: e.window.start, end: e.window.end,
    was: e.prev ? `${e.prev.start}..${e.prev.end}` : '' });
}
fs.writeFileSync(LOG, toCSV(
  ['detected','resort','name','park','type','kind','start','end','was'], logged));

const real = events.filter(e => !e.note).length;
fs.writeFileSync(OUT, report(stamp, summary, events, curWins, hz, failures));
fs.writeFileSync('events.txt', String(real));
if (real > 0 || !prevRows.length) fs.writeFileSync('POST_COMMENT', '1');
console.log(`SUMMARY events=${real} suppressed=${events.filter(e => e.note).length} failures=${failures.length}`);
