const q = v => {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

export const toCSV = (cols, rows) =>
  [cols.join(',')].concat(rows.map(r => cols.map(c => q(r[c])).join(','))).join('\n') + '\n';

export function fromCSV(text) {
  const out = [];
  const lines = String(text || '').split(/\r?\n/).filter(l => l.length);
  if (!lines.length) return out;
  const cols = splitLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const v = splitLine(lines[i]);
    const o = {};
    cols.forEach((c, j) => { o[c] = v[j] == null ? '' : v[j]; });
    out.push(o);
  }
  return out;
}

function splitLine(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export const CLOSURE_COLS = ['resort', 'id', 'name', 'park', 'date', 'type'];
export const HORIZON_COLS = ['resort', 'date', 'entities', 'scheduled'];
