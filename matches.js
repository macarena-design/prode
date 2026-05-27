/* =========================================================
   PRODE DT — Datos del torneo: Copa Mundial FIFA 2026
   Grupos, equipos y fixture completo
   ========================================================= */

const TEAMS = {
  // GRUPO A
  MEX: { name: 'México',          flag: '🇲🇽', group: 'A' },
  RSA: { name: 'Sudáfrica',       flag: '🇿🇦', group: 'A' },
  KOR: { name: 'Corea del Sur',   flag: '🇰🇷', group: 'A' },
  CZE: { name: 'Rep. Checa',      flag: '🇨🇿', group: 'A' },
  // GRUPO B
  CAN: { name: 'Canadá',          flag: '🇨🇦', group: 'B' },
  BIH: { name: 'Bosnia',          flag: '🇧🇦', group: 'B' },
  USA: { name: 'Estados Unidos',  flag: '🇺🇸', group: 'B' },
  PAR: { name: 'Paraguay',        flag: '🇵🇾', group: 'B' },
  // GRUPO C
  QAT: { name: 'Catar',           flag: '🇶🇦', group: 'C' },
  SUI: { name: 'Suiza',           flag: '🇨🇭', group: 'C' },
  BRA: { name: 'Brasil',          flag: '🇧🇷', group: 'C' },
  MAR: { name: 'Marruecos',       flag: '🇲🇦', group: 'C' },
  // GRUPO D
  HAI: { name: 'Haití',           flag: '🇭🇹', group: 'D' },
  SCO: { name: 'Escocia',         flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'D' },
  AUS: { name: 'Australia',       flag: '🇦🇺', group: 'D' },
  TUR: { name: 'Turquía',         flag: '🇹🇷', group: 'D' },
  // GRUPO E
  GER: { name: 'Alemania',        flag: '🇩🇪', group: 'E' },
  CUW: { name: 'Curazao',         flag: '🇨🇼', group: 'E' },
  NED: { name: 'Países Bajos',    flag: '🇳🇱', group: 'E' },
  JPN: { name: 'Japón',           flag: '🇯🇵', group: 'E' },
  // GRUPO F
  CIV: { name: 'Costa de Marfil', flag: '🇨🇮', group: 'F' },
  ECU: { name: 'Ecuador',         flag: '🇪🇨', group: 'F' },
  SWE: { name: 'Suecia',          flag: '🇸🇪', group: 'F' },
  TUN: { name: 'Túnez',           flag: '🇹🇳', group: 'F' },
  // GRUPO G
  ESP: { name: 'España',          flag: '🇪🇸', group: 'G' },
  CPV: { name: 'Cabo Verde',      flag: '🇨🇻', group: 'G' },
  BEL: { name: 'Bélgica',         flag: '🇧🇪', group: 'G' },
  EGY: { name: 'Egipto',          flag: '🇪🇬', group: 'G' },
  // GRUPO H
  KSA: { name: 'Arabia Saudita',  flag: '🇸🇦', group: 'H' },
  URU: { name: 'Uruguay',         flag: '🇺🇾', group: 'H' },
  IRN: { name: 'Irán',            flag: '🇮🇷', group: 'H' },
  NZL: { name: 'Nueva Zelanda',   flag: '🇳🇿', group: 'H' },
  // GRUPO I
  FRA: { name: 'Francia',         flag: '🇫🇷', group: 'I' },
  SEN: { name: 'Senegal',         flag: '🇸🇳', group: 'I' },
  IRQ: { name: 'Irak',            flag: '🇮🇶', group: 'I' },
  NOR: { name: 'Noruega',         flag: '🇳🇴', group: 'I' },
  // GRUPO J
  ARG: { name: 'Argentina',       flag: '🇦🇷', group: 'J' },
  ALG: { name: 'Argelia',         flag: '🇩🇿', group: 'J' },
  AUT: { name: 'Austria',         flag: '🇦🇹', group: 'J' },
  JOR: { name: 'Jordania',        flag: '🇯🇴', group: 'J' },
  // GRUPO K
  POR: { name: 'Portugal',        flag: '🇵🇹', group: 'K' },
  COD: { name: 'RD Congo',        flag: '🇨🇩', group: 'K' },
  ENG: { name: 'Inglaterra',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'K' },
  CRO: { name: 'Croacia',         flag: '🇭🇷', group: 'K' },
  // GRUPO L
  GHA: { name: 'Ghana',           flag: '🇬🇭', group: 'L' },
  PAN: { name: 'Panamá',          flag: '🇵🇦', group: 'L' },
  UZB: { name: 'Uzbekistán',      flag: '🇺🇿', group: 'L' },
  COL: { name: 'Colombia',        flag: '🇨🇴', group: 'L' },
};

/* -------------------------
   HELPER
   date format: "YYYY-MM-DD HH:MM" en horario de Argentina (ART, UTC-3)
   ------------------------- */
function md(id, group, matchday, date, time, home, away) {
  return { id, stage: 'group', group, matchday, date, time, home, away,
           homeScore: null, awayScore: null, penaltyWinner: null, status: 'upcoming' };
}
function ko(id, round, date, time, home, away, label) {
  return { id, stage: 'knockout', round, date, time,
           home: home || 'TBD', away: away || 'TBD',
           homeLabel: label ? label[0] : null,
           awayLabel: label ? label[1] : null,
           homeScore: null, awayScore: null, penaltyWinner: null, status: 'upcoming' };
}

const MATCHES = [
  /* =====================================================
     FASE DE GRUPOS — FECHA 1 (11–17 junio 2026)
     ===================================================== */
  // Grupo A
  md('g-A-1a', 'A', 1, '2026-06-11', '16:00', 'MEX', 'RSA'),
  md('g-A-1b', 'A', 1, '2026-06-11', '20:00', 'KOR', 'CZE'),
  // Grupo B
  md('g-B-1a', 'B', 1, '2026-06-12', '16:00', 'CAN', 'BIH'),
  md('g-B-1b', 'B', 1, '2026-06-12', '22:00', 'USA', 'PAR'),
  // Grupo C
  md('g-C-1a', 'C', 1, '2026-06-13', '16:00', 'QAT', 'SUI'),
  md('g-C-1b', 'C', 1, '2026-06-13', '19:00', 'BRA', 'MAR'),
  // Grupo D
  md('g-D-1a', 'D', 1, '2026-06-13', '22:00', 'HAI', 'SCO'),
  md('g-D-1b', 'D', 1, '2026-06-14', '01:00', 'AUS', 'TUR'),
  // Grupo E
  md('g-E-1a', 'E', 1, '2026-06-14', '14:00', 'GER', 'CUW'),
  md('g-E-1b', 'E', 1, '2026-06-14', '17:00', 'NED', 'JPN'),
  // Grupo F
  md('g-F-1a', 'F', 1, '2026-06-14', '20:00', 'CIV', 'ECU'),
  md('g-F-1b', 'F', 1, '2026-06-14', '22:00', 'SWE', 'TUN'),
  // Grupo G
  md('g-G-1a', 'G', 1, '2026-06-15', '13:00', 'ESP', 'CPV'),
  md('g-G-1b', 'G', 1, '2026-06-15', '16:00', 'BEL', 'EGY'),
  // Grupo H
  md('g-H-1a', 'H', 1, '2026-06-15', '19:00', 'KSA', 'URU'),
  md('g-H-1b', 'H', 1, '2026-06-15', '22:00', 'IRN', 'NZL'),
  // Grupo I
  md('g-I-1a', 'I', 1, '2026-06-16', '16:00', 'FRA', 'SEN'),
  md('g-I-1b', 'I', 1, '2026-06-16', '19:00', 'IRQ', 'NOR'),
  // Grupo J
  md('g-J-1a', 'J', 1, '2026-06-16', '22:00', 'ARG', 'ALG'),
  md('g-J-1b', 'J', 1, '2026-06-16', '22:00', 'AUT', 'JOR'),
  // Grupo K
  md('g-K-1a', 'K', 1, '2026-06-17', '14:00', 'POR', 'COD'),
  md('g-K-1b', 'K', 1, '2026-06-17', '17:00', 'ENG', 'CRO'),
  // Grupo L
  md('g-L-1a', 'L', 1, '2026-06-17', '20:00', 'GHA', 'PAN'),
  md('g-L-1b', 'L', 1, '2026-06-17', '22:00', 'UZB', 'COL'),

  /* =====================================================
     FASE DE GRUPOS — FECHA 2 (19–25 junio 2026)
     ===================================================== */
  // Grupo A
  md('g-A-2a', 'A', 2, '2026-06-19', '16:00', 'MEX', 'KOR'),
  md('g-A-2b', 'A', 2, '2026-06-19', '20:00', 'RSA', 'CZE'),
  // Grupo B
  md('g-B-2a', 'B', 2, '2026-06-19', '22:00', 'CAN', 'USA'),
  md('g-B-2b', 'B', 2, '2026-06-20', '01:00', 'BIH', 'PAR'),
  // Grupo C
  md('g-C-2a', 'C', 2, '2026-06-20', '16:00', 'QAT', 'BRA'),
  md('g-C-2b', 'C', 2, '2026-06-20', '19:00', 'SUI', 'MAR'),
  // Grupo D
  md('g-D-2a', 'D', 2, '2026-06-20', '22:00', 'HAI', 'AUS'),
  md('g-D-2b', 'D', 2, '2026-06-21', '01:00', 'SCO', 'TUR'),
  // Grupo E
  md('g-E-2a', 'E', 2, '2026-06-21', '14:00', 'GER', 'NED'),
  md('g-E-2b', 'E', 2, '2026-06-21', '17:00', 'CUW', 'JPN'),
  // Grupo F
  md('g-F-2a', 'F', 2, '2026-06-21', '20:00', 'CIV', 'SWE'),
  md('g-F-2b', 'F', 2, '2026-06-21', '22:00', 'ECU', 'TUN'),
  // Grupo G
  md('g-G-2a', 'G', 2, '2026-06-22', '13:00', 'ESP', 'BEL'),
  md('g-G-2b', 'G', 2, '2026-06-22', '16:00', 'CPV', 'EGY'),
  // Grupo H
  md('g-H-2a', 'H', 2, '2026-06-22', '19:00', 'KSA', 'IRN'),
  md('g-H-2b', 'H', 2, '2026-06-22', '22:00', 'URU', 'NZL'),
  // Grupo I
  md('g-I-2a', 'I', 2, '2026-06-23', '16:00', 'FRA', 'IRQ'),
  md('g-I-2b', 'I', 2, '2026-06-23', '19:00', 'SEN', 'NOR'),
  // Grupo J
  md('g-J-2a', 'J', 2, '2026-06-23', '22:00', 'ARG', 'AUT'),
  md('g-J-2b', 'J', 2, '2026-06-23', '22:00', 'ALG', 'JOR'),
  // Grupo K
  md('g-K-2a', 'K', 2, '2026-06-24', '14:00', 'POR', 'ENG'),
  md('g-K-2b', 'K', 2, '2026-06-24', '17:00', 'COD', 'CRO'),
  // Grupo L
  md('g-L-2a', 'L', 2, '2026-06-24', '20:00', 'GHA', 'UZB'),
  md('g-L-2b', 'L', 2, '2026-06-24', '22:00', 'PAN', 'COL'),

  /* =====================================================
     FASE DE GRUPOS — FECHA 3 (27 junio – 2 julio 2026)
     Simultáneos por grupo
     ===================================================== */
  // Grupo A (simultáneos)
  md('g-A-3a', 'A', 3, '2026-06-27', '20:00', 'MEX', 'CZE'),
  md('g-A-3b', 'A', 3, '2026-06-27', '20:00', 'RSA', 'KOR'),
  // Grupo B (simultáneos)
  md('g-B-3a', 'B', 3, '2026-06-27', '16:00', 'CAN', 'PAR'),
  md('g-B-3b', 'B', 3, '2026-06-27', '16:00', 'BIH', 'USA'),
  // Grupo C (simultáneos)
  md('g-C-3a', 'C', 3, '2026-06-28', '20:00', 'BRA', 'SUI'),
  md('g-C-3b', 'C', 3, '2026-06-28', '20:00', 'QAT', 'MAR'),
  // Grupo D (simultáneos)
  md('g-D-3a', 'D', 3, '2026-06-28', '16:00', 'AUS', 'SCO'),
  md('g-D-3b', 'D', 3, '2026-06-28', '16:00', 'HAI', 'TUR'),
  // Grupo E (simultáneos)
  md('g-E-3a', 'E', 3, '2026-06-29', '20:00', 'GER', 'JPN'),
  md('g-E-3b', 'E', 3, '2026-06-29', '20:00', 'CUW', 'NED'),
  // Grupo F (simultáneos)
  md('g-F-3a', 'F', 3, '2026-06-29', '16:00', 'ECU', 'SWE'),
  md('g-F-3b', 'F', 3, '2026-06-29', '16:00', 'CIV', 'TUN'),
  // Grupo G (simultáneos)
  md('g-G-3a', 'G', 3, '2026-06-30', '20:00', 'ESP', 'EGY'),
  md('g-G-3b', 'G', 3, '2026-06-30', '20:00', 'CPV', 'BEL'),
  // Grupo H (simultáneos)
  md('g-H-3a', 'H', 3, '2026-06-30', '16:00', 'URU', 'IRN'),
  md('g-H-3b', 'H', 3, '2026-06-30', '16:00', 'KSA', 'NZL'),
  // Grupo I (simultáneos)
  md('g-I-3a', 'I', 3, '2026-07-01', '20:00', 'FRA', 'NOR'),
  md('g-I-3b', 'I', 3, '2026-07-01', '20:00', 'SEN', 'IRQ'),
  // Grupo J (simultáneos)
  md('g-J-3a', 'J', 3, '2026-07-01', '16:00', 'ARG', 'JOR'),
  md('g-J-3b', 'J', 3, '2026-07-01', '16:00', 'ALG', 'AUT'),
  // Grupo K (simultáneos)
  md('g-K-3a', 'K', 3, '2026-07-02', '20:00', 'POR', 'CRO'),
  md('g-K-3b', 'K', 3, '2026-07-02', '20:00', 'COD', 'ENG'),
  // Grupo L (simultáneos)
  md('g-L-3a', 'L', 3, '2026-07-02', '16:00', 'COL', 'GHA'),
  md('g-L-3b', 'L', 3, '2026-07-02', '16:00', 'UZB', 'PAN'),

  /* =====================================================
     FASE FINAL — RONDA DE 32 (4–10 julio 2026)
     ===================================================== */
  ko('k-r32-1',  'r32', '2026-07-04', '16:00', null, null, ['1er Grupo A', '2do Grupo B']),
  ko('k-r32-2',  'r32', '2026-07-04', '20:00', null, null, ['1er Grupo C', '2do Grupo D']),
  ko('k-r32-3',  'r32', '2026-07-05', '16:00', null, null, ['1er Grupo E', '2do Grupo F']),
  ko('k-r32-4',  'r32', '2026-07-05', '20:00', null, null, ['1er Grupo G', '2do Grupo H']),
  ko('k-r32-5',  'r32', '2026-07-05', '22:00', null, null, ['1er Grupo I', '2do Grupo J']),
  ko('k-r32-6',  'r32', '2026-07-06', '16:00', null, null, ['1er Grupo K', '2do Grupo L']),
  ko('k-r32-7',  'r32', '2026-07-06', '20:00', null, null, ['1er Grupo B', '2do Grupo A']),
  ko('k-r32-8',  'r32', '2026-07-06', '22:00', null, null, ['1er Grupo D', '2do Grupo C']),
  ko('k-r32-9',  'r32', '2026-07-07', '16:00', null, null, ['1er Grupo F', '2do Grupo E']),
  ko('k-r32-10', 'r32', '2026-07-07', '20:00', null, null, ['1er Grupo H', '2do Grupo G']),
  ko('k-r32-11', 'r32', '2026-07-07', '22:00', null, null, ['1er Grupo J', '2do Grupo I']),
  ko('k-r32-12', 'r32', '2026-07-08', '16:00', null, null, ['1er Grupo L', '2do Grupo K']),
  ko('k-r32-13', 'r32', '2026-07-08', '20:00', null, null, ['Mejor 3ro 1', 'Mejor 3ro 2']),
  ko('k-r32-14', 'r32', '2026-07-09', '16:00', null, null, ['Mejor 3ro 3', 'Mejor 3ro 4']),
  ko('k-r32-15', 'r32', '2026-07-09', '20:00', null, null, ['Mejor 3ro 5', 'Mejor 3ro 6']),
  ko('k-r32-16', 'r32', '2026-07-10', '16:00', null, null, ['Mejor 3ro 7', 'Mejor 3ro 8']),

  /* =====================================================
     FASE FINAL — OCTAVOS DE FINAL (11–14 julio 2026)
     ===================================================== */
  ko('k-r16-1', 'r16', '2026-07-11', '16:00', null, null, ['Gan. R32-1',  'Gan. R32-2']),
  ko('k-r16-2', 'r16', '2026-07-11', '20:00', null, null, ['Gan. R32-3',  'Gan. R32-4']),
  ko('k-r16-3', 'r16', '2026-07-12', '16:00', null, null, ['Gan. R32-5',  'Gan. R32-6']),
  ko('k-r16-4', 'r16', '2026-07-12', '20:00', null, null, ['Gan. R32-7',  'Gan. R32-8']),
  ko('k-r16-5', 'r16', '2026-07-13', '16:00', null, null, ['Gan. R32-9',  'Gan. R32-10']),
  ko('k-r16-6', 'r16', '2026-07-13', '20:00', null, null, ['Gan. R32-11', 'Gan. R32-12']),
  ko('k-r16-7', 'r16', '2026-07-14', '16:00', null, null, ['Gan. R32-13', 'Gan. R32-14']),
  ko('k-r16-8', 'r16', '2026-07-14', '20:00', null, null, ['Gan. R32-15', 'Gan. R32-16']),

  /* =====================================================
     FASE FINAL — CUARTOS DE FINAL (18–19 julio 2026)
     ===================================================== */
  ko('k-qf-1', 'qf', '2026-07-18', '16:00', null, null, ['Gan. R16-1', 'Gan. R16-2']),
  ko('k-qf-2', 'qf', '2026-07-18', '20:00', null, null, ['Gan. R16-3', 'Gan. R16-4']),
  ko('k-qf-3', 'qf', '2026-07-19', '16:00', null, null, ['Gan. R16-5', 'Gan. R16-6']),
  ko('k-qf-4', 'qf', '2026-07-19', '20:00', null, null, ['Gan. R16-7', 'Gan. R16-8']),

  /* =====================================================
     FASE FINAL — SEMIFINALES (23–24 julio 2026)
     ===================================================== */
  ko('k-sf-1', 'sf', '2026-07-23', '20:00', null, null, ['Gan. QF-1', 'Gan. QF-2']),
  ko('k-sf-2', 'sf', '2026-07-24', '20:00', null, null, ['Gan. QF-3', 'Gan. QF-4']),

  /* =====================================================
     3er PUESTO Y FINAL
     ===================================================== */
  ko('k-3rd',   '3rd',   '2026-07-28', '20:00', null, null, ['Per. SF-1', 'Per. SF-2']),
  ko('k-final', 'final', '2026-07-29', '20:00', null, null, ['Gan. SF-1', 'Gan. SF-2']),
];

/* ---- Utilidades de acceso ---- */
function getMatch(id)   { return MATCHES.find(m => m.id === id); }
function getTeam(code)  { return TEAMS[code] || { name: code, flag: '🏳️', group: null }; }
function getGroupMatches(group, matchday) {
  return MATCHES.filter(m => m.stage === 'group' && m.group === group && m.matchday === matchday);
}
function getMatchdayMatches(matchday) {
  return MATCHES.filter(m => m.stage === 'group' && m.matchday === matchday);
}
function getKnockoutRound(round) {
  return MATCHES.filter(m => m.stage === 'knockout' && m.round === round);
}

const KNOCKOUT_ROUNDS = [
  { id: 'r32',   label: 'Ronda de 32' },
  { id: 'r16',   label: 'Octavos de Final' },
  { id: 'qf',    label: 'Cuartos de Final' },
  { id: 'sf',    label: 'Semifinales' },
  { id: '3rd',   label: '3er Puesto' },
  { id: 'final', label: 'Final' },
];

const STAGE_LABELS = {
  'group-1': 'Fase de Grupos · Fecha 1',
  'group-2': 'Fase de Grupos · Fecha 2',
  'group-3': 'Fase de Grupos · Fecha 3',
  'r32':     'Ronda de 32',
  'r16':     'Octavos de Final',
  'qf':      'Cuartos de Final',
  'sf':      'Semifinales',
  '3rd':     '3er Puesto',
  'final':   'Gran Final',
};

/* Day labels in Spanish */
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatMatchDate(dateStr, timeStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  const day = DAYS_ES[date.getDay()];
  const month = MONTHS_ES[mo - 1];
  return `${day} ${d}/${mo < 10 ? '0' + mo : mo} · ${timeStr}`;
}

function getMatchDateKey(dateStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  const day = DAYS_ES[date.getDay()];
  return `${day} ${d} de ${MONTHS_ES[mo - 1].charAt(0).toUpperCase() + MONTHS_ES[mo - 1].slice(1)} de ${y}`;
}

/* Check if match is locked based on current ART time */
function isMatchLocked(match) {
  if (match.status === 'locked' || match.status === 'finished') return true;
  const now = new Date();
  const [y, mo, d] = match.date.split('-').map(Number);
  const [h, min] = match.time.split(':').map(Number);
  // ART = UTC-3, so matchTime UTC = matchTime ART + 3h
  const matchUTC = new Date(Date.UTC(y, mo - 1, d, h + 3, min));
  return now >= matchUTC;
}
