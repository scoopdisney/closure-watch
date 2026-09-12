// Resort config for the closure watch.
export const RESORTS = [
  { key: 'DLR', label: 'Disneyland Resort',
    host: 'disneyland.disney.go.com', dest: '80008297' },
  { key: 'WDW', label: 'Walt Disney World',
    host: 'disneyworld.disney.go.com', dest: '80007798' }
];

export const OVERLAY_PAIRS = [
  ['haunted mansion', 'haunted mansion holiday'],
  ['its a small world', 'its a small world holiday'],
  ['jungle cruise', 'jingle cruise'],
  ['maters junkyard jamboree', 'maters jingle jamboree'],
  ['luigis rollickin roadsters', 'luigis joy to the whirl'],
  ['soarin around the world', 'soarin over california'],
  ['space mountain', 'hyperspace mountain']
];

export const EVENT_ONLY = [
  'villains grove at oogie boogie bash'
];

export const norm = s => (s || '')
  .replace(/[\u2018\u2019\u201c\u201d"']/g, '')
  .replace(/[\u00ae\u2122\u00a9*]/g, '')
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
