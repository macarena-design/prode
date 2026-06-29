/* =========================================================
   PRODE DT — Lógica principal de la aplicación
   Copa Mundial FIFA 2026
   ========================================================= */

/* =========================================================
   ESTADO GLOBAL
   ========================================================= */
const State = {
  user:             null,
  isAdmin:          false,
  currentView:      'jugar',
  currentStage:     'group',
  currentMatchday:  1,
  currentRound:     'r32',
  predictions:      {},     // matchId → { homeScore, awayScore, penaltyWinner }
  savedPredictions: {},     // last saved state (for dirty tracking)
  remoteMatches:    {},     // matchId → match data from Firestore (has results)
  standings:        [],
  dirty:            false,
};

let _syncInterval    = null; // ESPN auto-sync interval (admin panel)
let _refreshInterval = null; // Firestore re-read interval (all users)

/* =========================================================
   AUTH
   ========================================================= */

const provider = new firebase.auth.GoogleAuthProvider();

document.getElementById('btn-google-login').addEventListener('click', async () => {
  try {
    showLoading(true);
    await auth.signInWithPopup(provider);
  } catch (err) {
    showLoading(false);
    showToast('Error al iniciar sesión: ' + err.message, 'error');
  }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
  if (State.dirty) {
    if (!confirm('Tenés cambios sin guardar. ¿Querés salir igual?')) return;
  }
  await auth.signOut();
});

auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Check if allowed
    if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(user.email)) {
      showToast('Tu cuenta no tiene acceso a este juego.', 'error');
      await auth.signOut();
      showLoading(false);
      return;
    }
    State.user = user;
    State.isAdmin = ADMIN_EMAILS.includes(user.email);
    await onLogin(user);
  } else {
    State.user = null;
    State.isAdmin = false;
    onLogout();
  }
});

async function onLogin(user) {
  // Save/update user in Firestore
  try {
    await db.collection('users').doc(user.uid).set({
      uid:          user.uid,
      displayName:  user.displayName,
      email:        user.email,
      photoURL:     user.photoURL || '',
      registeredAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (e) { /* non-critical */ }

  // Update UI
  document.getElementById('user-name').textContent = user.displayName?.split(' ')[0] || user.email;
  const photoEl = document.getElementById('user-photo');
  if (user.photoURL) { photoEl.src = user.photoURL; photoEl.style.display = 'block'; }

  // Show admin buttons
  if (State.isAdmin) {
    document.querySelectorAll('.admin-btn').forEach(b => b.classList.remove('hidden'));
  }

  // Switch screens
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  // Load data
  await loadUserPredictions();
  renderCurrentView();
  showLoading(false);

  // Refresh Firestore match data every 5 min for all users
  clearInterval(_refreshInterval);
  _refreshInterval = setInterval(async () => {
    await loadRemoteMatchData();
    if (State.currentView === 'jugar') renderMatchesView();
    if (State.currentView === 'posiciones') renderStandings();
  }, 60 * 60 * 1000);
}

function onLogout() {
  clearInterval(_refreshInterval);
  clearInterval(_syncInterval);
  _refreshInterval = null;
  _syncInterval = null;
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  State.predictions = {};
  State.savedPredictions = {};
  State.dirty = false;
}

/* =========================================================
   NAVIGATION
   ========================================================= */

document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    navigateTo(view);
    // Close mobile nav
    document.getElementById('mobile-nav').classList.add('hidden');
  });
});

document.getElementById('mobile-menu-btn').addEventListener('click', () => {
  document.getElementById('mobile-nav').classList.toggle('hidden');
});

document.querySelector('.footer-link[data-view]').addEventListener('click', (e) => {
  navigateTo(e.target.dataset.view);
});

function navigateTo(view) {
  // Stop ESPN sync polling when leaving admin panel
  if (State.currentView === 'admin' && view !== 'admin') {
    clearInterval(_syncInterval);
    _syncInterval = null;
  }
  State.currentView = view;
  // Update nav buttons
  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  // Show/hide views
  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('active', v.id === `view-${view}`);
    v.classList.toggle('hidden', v.id !== `view-${view}`);
  });

  if (view === 'jugar') renderMatchesView();
  if (view === 'posiciones') renderStandings();
  if (view === 'admin' && State.isAdmin) renderAdminView();
}

function renderCurrentView() {
  navigateTo(State.currentView);
}

/* =========================================================
   STAGE + MATCHDAY TABS
   ========================================================= */

document.querySelectorAll('.stage-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    State.currentStage = tab.dataset.stage;
    document.querySelectorAll('.stage-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const groupTabs = document.getElementById('group-matchday-tabs');
    const knockoutTabs = document.getElementById('knockout-round-tabs');

    if (State.currentStage === 'group') {
      groupTabs.classList.remove('hidden');
      knockoutTabs.classList.add('hidden');
    } else {
      groupTabs.classList.add('hidden');
      knockoutTabs.classList.remove('hidden');
      // Activate first knockout tab
      const firstKoTab = knockoutTabs.querySelector('.matchday-tab');
      if (firstKoTab) { firstKoTab.click(); return; }
    }
    renderMatchesView();
  });
});

document.querySelectorAll('#group-matchday-tabs .matchday-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    State.currentMatchday = parseInt(tab.dataset.matchday);
    document.querySelectorAll('#group-matchday-tabs .matchday-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    updateStageLabel();
    renderMatchesView();
  });
});

document.querySelectorAll('#knockout-round-tabs .matchday-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    State.currentRound = tab.dataset.round;
    document.querySelectorAll('#knockout-round-tabs .matchday-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    updateStageLabel();
    renderMatchesView();
  });
});

function updateStageLabel() {
  let label = '';
  if (State.currentStage === 'group') {
    label = STAGE_LABELS[`group-${State.currentMatchday}`] || '';
  } else {
    label = STAGE_LABELS[State.currentRound] || '';
  }
  document.getElementById('active-stage-label').textContent = label;
}

/* =========================================================
   FIRESTORE — MATCHES (remote results override)
   ========================================================= */

async function loadRemoteMatchData() {
  try {
    const snap = await db.collection('matches').get();
    snap.forEach(doc => {
      State.remoteMatches[doc.id] = doc.data();
    });
  } catch (e) { /* offline fallback: use static matches.js */ }
}

function getMergedMatch(staticMatch) {
  const remote = State.remoteMatches[staticMatch.id];
  if (!remote) return { ...staticMatch };
  return {
    ...staticMatch,
    home:          remote.home          || staticMatch.home,
    away:          remote.away          || staticMatch.away,
    homeLabel:     remote.homeLabel     || staticMatch.homeLabel,
    awayLabel:     remote.awayLabel     || staticMatch.awayLabel,
    homeScore:     remote.homeScore     !== undefined ? remote.homeScore : null,
    awayScore:     remote.awayScore     !== undefined ? remote.awayScore : null,
    penaltyWinner: remote.penaltyWinner || null,
    status:        remote.status        || staticMatch.status,
    date:          remote.date          || staticMatch.date,
    time:          remote.time          || staticMatch.time,
    group:         remote.group         || staticMatch.group,
  };
}

/* =========================================================
   FIRESTORE — USER PREDICTIONS
   ========================================================= */

async function loadUserPredictions() {
  if (!State.user) return;
  try {
    const snap = await db.collection('predictions')
      .where('userId', '==', State.user.uid)
      .get();
    snap.forEach(doc => {
      const data = doc.data();
      State.predictions[data.matchId] = {
        homeScore:     data.homeScore,
        awayScore:     data.awayScore,
        penaltyWinner: data.penaltyWinner || null,
      };
    });
    State.savedPredictions = JSON.parse(JSON.stringify(State.predictions));
  } catch (e) { /* offline */ }
  await loadRemoteMatchData();
}

async function savePredictions() {
  if (!State.user) return;
  showLoading(true);
  const batch = db.batch();
  const now = firebase.firestore.FieldValue.serverTimestamp();

  let saved = 0;
  for (const [matchId, pred] of Object.entries(State.predictions)) {
    const match = getMergedMatch(getMatch(matchId) || {});
    if (isMatchLocked(match)) continue; // Don't save locked
    if (pred.homeScore === null && pred.awayScore === null) continue;

    const ref = db.collection('predictions').doc(`${State.user.uid}_${matchId}`);
    batch.set(ref, {
      userId:        State.user.uid,
      matchId,
      homeScore:     pred.homeScore,
      awayScore:     pred.awayScore,
      penaltyWinner: pred.penaltyWinner || null,
      updatedAt:     now,
    }, { merge: true });
    saved++;
  }

  try {
    await batch.commit();
    State.savedPredictions = JSON.parse(JSON.stringify(State.predictions));
    State.dirty = false;
    hideSaveBar();
    showToast(`✅ ${saved} pronóstico${saved !== 1 ? 's' : ''} guardado${saved !== 1 ? 's' : ''}`, 'success');
  } catch (err) {
    showToast('Error al guardar: ' + err.message, 'error');
  }
  showLoading(false);
}

document.getElementById('btn-save-predictions').addEventListener('click', savePredictions);

/* =========================================================
   SCORING ENGINE
   ========================================================= */

function calculatePoints(pred, match) {
  if (!pred) return null;
  const { homeScore: pH, awayScore: pA, penaltyWinner: pPW } = pred;
  const { homeScore: rH, awayScore: rA, penaltyWinner: rPW } = match;

  if (rH === null || rA === null || pH === null || pA === null) return null;

  let points = 0;
  const isExact = pH === rH && pA === rA;

  if (isExact) {
    points = 12;
  } else {
    const predResult = pH > pA ? 'H' : pA > pH ? 'A' : 'D';
    const realResult = rH > rA ? 'H' : rA > rH ? 'A' : 'D';
    if (predResult === realResult) points += 5;
    if (pH === rH) points += 2;
    if (pA === rA) points += 2;
  }

  // Penalty bonus: applies when predicted a draw (pH === pA) AND there's a penalty result
  if (rPW && pPW && pH === pA) {
    if (pPW === rPW) points += 5;
  }

  return points;
}

function getPointsClass(pts) {
  if (pts === null)    return 'zero';
  if (pts === 0)       return 'zero';
  if (pts <= 4)        return 'low';
  if (pts <= 7)        return 'mid';
  if (pts === 12)      return 'exact';
  if (pts > 12)        return 'exact';
  return 'high';
}

/* =========================================================
   RENDER: MATCH CARDS (JUGAR view)
   ========================================================= */

async function renderMatchesView() {
  const container = document.getElementById('matches-container');
  container.innerHTML = '<div class="loading-state"><div class="spinner-small"></div><p>Cargando partidos...</p></div>';

  let matches;
  if (State.currentStage === 'group') {
    matches = getMatchdayMatches(State.currentMatchday);
  } else {
    matches = getKnockoutRound(State.currentRound);
  }

  updateStageLabel();

  if (!matches.length) {
    container.innerHTML = '<div class="loading-state"><p>No hay partidos disponibles para esta etapa.</p></div>';
    return;
  }

  // Merge with remote data
  const mergedMatches = matches.map(m => getMergedMatch(m));

  // Group by date
  const byDate = {};
  mergedMatches.forEach(m => {
    const key = getMatchDateKey(m.date);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(m);
  });

  let html = '';
  for (const [dateLabel, dayMatches] of Object.entries(byDate)) {
    html += `<div class="date-group">
      <div class="date-group-label">📅 ${dateLabel}</div>
      <div class="matches-grid">`;
    dayMatches.forEach(match => {
      html += renderMatchCard(match);
    });
    html += `</div></div>`;
  }

  container.innerHTML = html;
  attachMatchCardListeners(container);
}

function getTeamDisplay(match, side) {
  const code = match[side]; // 'home' or 'away'
  const labelKey = side + 'Label'; // 'homeLabel' or 'awayLabel'
  if (!code || code === 'TBD') {
    return {
      flag: '🏳️',
      name: match[labelKey] || 'Por definir',
    };
  }
  const team = getTeam(code);
  return { flag: team.flag, name: team.name };
}

function renderMatchCard(match) {
  const locked = isMatchLocked(match);
  const finished = match.status === 'finished' || (match.homeScore !== null && match.awayScore !== null);
  const pred = State.predictions[match.id];
  const pts = finished ? calculatePoints(pred, match) : null;

  const homeTeam = getTeamDisplay(match, 'home');
  const awayTeam = getTeamDisplay(match, 'away');

  const groupLabel = match.stage === 'group'
    ? `<span class="match-group-badge group-${match.group?.toLowerCase()}">${match.group ? 'Grupo ' + match.group : ''}</span>`
    : `<span class="match-group-badge knockout">${KNOCKOUT_ROUNDS.find(r=>r.id===match.round)?.label||match.round}</span>`;

  const statusBadge = locked && !finished
    ? `<span class="match-status-badge locked">🔒 EN JUEGO</span>`
    : finished
    ? `<span class="match-status-badge finished">✓ FINALIZADO</span>`
    : '';

  const isKnockout = match.stage === 'knockout';
  const isPredictedDraw = pred && pred.homeScore !== null && pred.awayScore !== null && pred.homeScore === pred.awayScore;

  let scoreArea = '';
  if (!locked && !finished) {
    // Editable inputs
    const hVal = pred?.homeScore !== null && pred?.homeScore !== undefined ? pred.homeScore : '';
    const aVal = pred?.awayScore !== null && pred?.awayScore !== undefined ? pred.awayScore : '';
    const hFilled = hVal !== '' ? 'filled' : '';
    const aFilled = aVal !== '' ? 'filled' : '';
    scoreArea = `
      <div class="match-score-area">
        <input type="number" class="score-input ${hFilled}" min="0" max="99"
          data-match="${match.id}" data-side="home" value="${hVal}" placeholder="–">
        <span class="score-separator">:</span>
        <input type="number" class="score-input ${aFilled}" min="0" max="99"
          data-match="${match.id}" data-side="away" value="${aVal}" placeholder="–">
      </div>`;
  } else {
    // Read-only display
    const hScore = match.homeScore !== null ? match.homeScore : (locked && pred?.homeScore !== null && pred?.homeScore !== undefined ? '' : '–');
    const aScore = match.awayScore !== null ? match.awayScore : (locked && pred?.awayScore !== null && pred?.awayScore !== undefined ? '' : '–');
    const hasResult = match.homeScore !== null;
    scoreArea = `
      <div class="score-display ${hasResult ? 'has-result' : ''}">
        <div class="score-num">${hasResult ? match.homeScore : '–'}</div>
        <div class="score-dash">:</div>
        <div class="score-num">${hasResult ? match.awayScore : '–'}</div>
      </div>`;
  }

  // Penalty selector (for knockout, editable, when predicted draw)
  let penaltySection = '';
  if (isKnockout) {
    if (!locked && !finished && isPredictedDraw) {
      const selH = pred?.penaltyWinner === match.home ? 'selected' : '';
      const selA = pred?.penaltyWinner === match.away ? 'selected' : '';
      penaltySection = `
        <div class="penalty-selector">
          <span class="penalty-label">🥅 Ganador por penales</span>
          <div class="penalty-btns">
            <button class="penalty-btn ${selH}" data-match="${match.id}" data-penalty="${match.home}">${homeTeam.name}</button>
            <button class="penalty-btn ${selA}" data-match="${match.id}" data-penalty="${match.away}">${awayTeam.name}</button>
          </div>
        </div>`;
    } else if (finished && match.penaltyWinner) {
      const pw = getTeam(match.penaltyWinner);
      penaltySection = `<div class="penalty-selector"><span class="penalty-label">🥅 Ganador por penales: <strong>${pw.name}</strong></span></div>`;
    } else if (locked && pred && pred.homeScore === pred.awayScore && pred.homeScore !== null) {
      const pw = pred.penaltyWinner ? getTeam(pred.penaltyWinner) : null;
      if (pw) penaltySection = `<div class="penalty-selector"><span class="penalty-label">Tu pronóstico penales: <strong>${pw.name}</strong></span></div>`;
    }
  }

  // Footer: prediction preview + points
  let footerHtml = '';
  if (pred && pred.homeScore !== null && pred.awayScore !== null) {
    let predStr = `${homeTeam.name.split(' ')[0]} <b>${pred.homeScore}</b> – <b>${pred.awayScore}</b> ${awayTeam.name.split(' ')[0]}`;
    if (pred.penaltyWinner) {
      const pw = getTeam(pred.penaltyWinner);
      predStr += ` <small>(${pw.name} pens)</small>`;
    }

    if (finished && pts !== null) {
      const ptsClass = getPointsClass(pts);
      const ptsStar = pts === 12 || pts === 17 ? ' ⭐' : '';
      footerHtml = `
        <span class="prediction-preview">Tu pronóstico: ${predStr}</span>
        <span class="points-earned ${ptsClass}">${pts} pts${ptsStar}</span>`;
    } else if (locked) {
      footerHtml = `<span class="prediction-preview">Pronóstico: ${predStr}</span>`;
    } else {
      footerHtml = `<span class="prediction-preview" style="color:var(--yellow)">✏️ ${predStr}</span>`;
    }
  } else if (!locked) {
    footerHtml = `<span class="prediction-preview" style="font-style:italic">Sin pronóstico aún</span>`;
  }

  const cardClasses = ['match-card',
    locked ? 'locked' : '',
    finished ? 'finished' : '',
    pts !== null && pts > 0 ? 'has-points' : '',
  ].filter(Boolean).join(' ');

  return `
<div class="${cardClasses}" data-match-id="${match.id}">
  <div class="match-card-header">
    <span class="match-time">${formatMatchDate(match.date, match.time)}</span>
    ${groupLabel}
    ${statusBadge}
  </div>
  <div class="match-card-body">
    <div class="match-teams">
      <div class="match-team">
        <span class="team-flag">${homeTeam.flag}</span>
        <span class="team-name">${homeTeam.name}</span>
      </div>
      ${scoreArea}
      <div class="match-team">
        <span class="team-flag">${awayTeam.flag}</span>
        <span class="team-name">${awayTeam.name}</span>
      </div>
    </div>
    ${penaltySection}
  </div>
  ${footerHtml ? `<div class="match-card-footer">${footerHtml}</div>` : ''}
</div>`;
}

function attachMatchCardListeners(container) {
  // Score inputs
  container.querySelectorAll('.score-input').forEach(input => {
    input.addEventListener('input', onScoreInput);
    input.addEventListener('change', onScoreInput);
  });

  // Penalty buttons
  container.querySelectorAll('.penalty-btn').forEach(btn => {
    btn.addEventListener('click', onPenaltySelect);
  });
}

function onScoreInput(e) {
  const input = e.target;
  const matchId = input.dataset.match;
  const side = input.dataset.side; // 'home' or 'away'
  let val = input.value.trim();

  if (val === '' || val === null) {
    // Clear this side
    if (!State.predictions[matchId]) State.predictions[matchId] = { homeScore: null, awayScore: null, penaltyWinner: null };
    State.predictions[matchId][side === 'home' ? 'homeScore' : 'awayScore'] = null;
  } else {
    const num = Math.max(0, Math.min(99, parseInt(val, 10)));
    input.value = num;
    if (!State.predictions[matchId]) State.predictions[matchId] = { homeScore: null, awayScore: null, penaltyWinner: null };
    State.predictions[matchId][side === 'home' ? 'homeScore' : 'awayScore'] = num;
    input.classList.add('filled');
  }

  // Check if we need to show/hide penalty selector for knockout
  const match = getMergedMatch(getMatch(matchId) || {});
  if (match.stage === 'knockout') {
    const pred = State.predictions[matchId] || {};
    const isDraw = pred.homeScore !== null && pred.awayScore !== null && pred.homeScore === pred.awayScore;
    const card = input.closest('.match-card');
    if (card) {
      let penaltyEl = card.querySelector('.penalty-selector');
      if (isDraw && !penaltyEl) {
        // Inject penalty selector
        const homeTeam = getTeamDisplay(match, 'home');
        const awayTeam = getTeamDisplay(match, 'away');
        const bodyEl = card.querySelector('.match-card-body');
        const penHtml = `
          <div class="penalty-selector">
            <span class="penalty-label">🥅 Ganador por penales</span>
            <div class="penalty-btns">
              <button class="penalty-btn" data-match="${matchId}" data-penalty="${match.home}">${homeTeam.name}</button>
              <button class="penalty-btn" data-match="${matchId}" data-penalty="${match.away}">${awayTeam.name}</button>
            </div>
          </div>`;
        bodyEl.insertAdjacentHTML('beforeend', penHtml);
        card.querySelectorAll('.penalty-btn').forEach(b => b.addEventListener('click', onPenaltySelect));
      } else if (!isDraw && penaltyEl) {
        penaltyEl.remove();
        if (State.predictions[matchId]) State.predictions[matchId].penaltyWinner = null;
      }
    }
  }

  markDirty();
  updateFooterPreview(matchId);
}

function onPenaltySelect(e) {
  const btn = e.target;
  const matchId = btn.dataset.match;
  const penaltyChoice = btn.dataset.penalty;

  if (!State.predictions[matchId]) State.predictions[matchId] = { homeScore: null, awayScore: null, penaltyWinner: null };
  State.predictions[matchId].penaltyWinner = penaltyChoice;

  // Update button styles
  const card = btn.closest('.match-card');
  card?.querySelectorAll('.penalty-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  markDirty();
}

function updateFooterPreview(matchId) {
  const match = getMergedMatch(getMatch(matchId) || {});
  const pred = State.predictions[matchId];
  const card = document.querySelector(`[data-match-id="${matchId}"]`);
  if (!card || !pred) return;

  let footer = card.querySelector('.match-card-footer');
  if (!footer) {
    card.insertAdjacentHTML('beforeend', '<div class="match-card-footer"></div>');
    footer = card.querySelector('.match-card-footer');
  }

  if (pred.homeScore !== null && pred.awayScore !== null) {
    const homeTeam = getTeamDisplay(match, 'home');
    const awayTeam = getTeamDisplay(match, 'away');
    footer.innerHTML = `<span class="prediction-preview" style="color:var(--yellow)">✏️ ${homeTeam.name.split(' ')[0]} <b>${pred.homeScore}</b> – <b>${pred.awayScore}</b> ${awayTeam.name.split(' ')[0]}</span>`;
  } else {
    footer.innerHTML = `<span class="prediction-preview" style="font-style:italic">Sin pronóstico aún</span>`;
  }
}

function markDirty() {
  if (!State.dirty) {
    State.dirty = true;
    showSaveBar();
  }
}

function showSaveBar() {
  const bar = document.getElementById('save-bar');
  bar.classList.remove('hidden');
}
function hideSaveBar() {
  document.getElementById('save-bar').classList.add('hidden');
}

/* =========================================================
   RENDER: STANDINGS
   ========================================================= */

async function renderStandings() {
  const container = document.getElementById('standings-container');
  container.innerHTML = '<div class="loading-state"><div class="spinner-small"></div><p>Calculando posiciones...</p></div>';

  try {
    // Load all users
    const usersSnap = await db.collection('users').get();
    const users = {};
    usersSnap.forEach(doc => { users[doc.id] = doc.data(); });

    // Load all predictions
    const predsSnap = await db.collection('predictions').get();
    const allPreds = {};
    predsSnap.forEach(doc => {
      const d = doc.data();
      if (!allPreds[d.userId]) allPreds[d.userId] = {};
      allPreds[d.userId][d.matchId] = d;
    });

    // Determine scope based on current tab
    const stype = document.querySelector('.stype-tab.active')?.dataset.stype || 'general';
    let scopeMatchIds = null;
    if (stype === 'matchday') {
      const scope = document.getElementById('standings-matchday-picker')?.value || 'group-1';
      scopeMatchIds = new Set();
      if (scope.startsWith('group-')) {
        const day = parseInt(scope.replace('group-', ''));
        getMatchdayMatches(day).forEach(m => scopeMatchIds.add(m.id));
      } else {
        getKnockoutRound(scope).forEach(m => scopeMatchIds.add(m.id));
      }
    }

    // Calculate scores
    const standings = [];
    for (const [uid, user] of Object.entries(users)) {
      let totalPoints = 0, exactResults = 0, predictedMatches = 0;
      const userPreds = allPreds[uid] || {};

      for (const match of MATCHES) {
        const m = getMergedMatch(match);
        if (m.homeScore === null || m.awayScore === null) continue;
        if (scopeMatchIds && !scopeMatchIds.has(match.id)) continue;

        const pred = userPreds[match.id];
        if (!pred) continue;
        predictedMatches++;

        const pts = calculatePoints(pred, m);
        if (pts !== null) {
          totalPoints += pts;
          if (pts === 12 || pts === 17) exactResults++;
        }
      }

      standings.push({
        uid,
        displayName:  user.displayName || user.email || 'Usuario',
        photoURL:     user.photoURL || '',
        email:        user.email,
        totalPoints,
        exactResults,
        predictedMatches,
        registeredAt: user.registeredAt,
      });
    }

    // Sort: points DESC → exactResults DESC → registeredAt ASC
    standings.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.exactResults !== a.exactResults) return b.exactResults - a.exactResults;
      const aT = a.registeredAt?.seconds || 0;
      const bT = b.registeredAt?.seconds || 0;
      return aT - bT;
    });

    State.standings = standings;
    renderStandingsTable(standings);
  } catch (err) {
    container.innerHTML = `<div class="loading-state"><p>Error cargando posiciones: ${err.message}</p></div>`;
  }
}

function renderStandingsTable(standings) {
  const search = document.getElementById('standings-search')?.value.toLowerCase() || '';
  const filtered = search ? standings.filter(s => s.displayName.toLowerCase().includes(search)) : standings;

  if (!filtered.length) {
    document.getElementById('standings-container').innerHTML =
      '<div class="loading-state"><p>No hay jugadores con puntos aún. ¡Cargá tus pronósticos!</p></div>';
    return;
  }

  let rows = '';
  filtered.forEach((s, idx) => {
    const rank = standings.indexOf(s) + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : '';
    const isMe = State.user?.uid === s.uid ? 'current-user' : '';
    const avatarHtml = s.photoURL
      ? `<img src="${s.photoURL}" class="standing-avatar" alt="" onerror="this.style.display='none'">`
      : `<div class="standing-avatar" style="background:var(--dark-4);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">${(s.displayName||'?')[0]}</div>`;

    rows += `
      <tr class="${isMe}">
        <td class="td-rank ${rankClass}">${rank}</td>
        <td><div class="td-name">${avatarHtml}<span class="standing-name">${s.displayName}${s.uid === State.user?.uid ? ' <small>(vos)</small>' : ''}</span></div></td>
        <td class="td-points">${s.totalPoints}</td>
        <td class="td-exact">${s.exactResults}</td>
        <td>${s.predictedMatches}</td>
      </tr>`;
  });

  document.getElementById('standings-container').innerHTML = `
    <table class="standings-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Jugador</th>
          <th>Puntos</th>
          <th>Exactos</th>
          <th>Pronosticados</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// Standings tab listeners
document.querySelectorAll('.stype-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.stype-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const byMatchday = tab.dataset.stype === 'matchday';
    document.getElementById('standings-matchday-select').classList.toggle('hidden', !byMatchday);
    renderStandings();
  });
});

document.getElementById('standings-matchday-picker')?.addEventListener('change', renderStandings);

document.getElementById('standings-search')?.addEventListener('input', (e) => {
  renderStandingsTable(State.standings);
});

/* =========================================================
   RENDER: ADMIN VIEW
   ========================================================= */

function renderAdminView() {
  if (!State.isAdmin) return;
  renderAdminMatchList();

  // Start ESPN auto-sync (immediate + every 5 min)
  clearInterval(_syncInterval);
  syncScoresFromESPN(false);
  _syncInterval = setInterval(() => syncScoresFromESPN(false), 60 * 60 * 1000);
}

async function renderAdminMatchList() {
  const stageKey = document.getElementById('admin-stage-filter').value;
  let matches;
  if (stageKey.startsWith('group-')) {
    const day = parseInt(stageKey.replace('group-', ''));
    matches = getMatchdayMatches(day);
  } else {
    matches = getKnockoutRound(stageKey);
  }

  const list = document.getElementById('admin-matches-list');
  let html = '';

  for (const m of matches) {
    const merged = getMergedMatch(m);
    const homeTeam = getTeamDisplay(merged, 'home');
    const awayTeam = getTeamDisplay(merged, 'away');
    const hScore = merged.homeScore !== null ? merged.homeScore : '';
    const aScore = merged.awayScore !== null ? merged.awayScore : '';
    const isKo = m.stage === 'knockout';

    let penaltyOptions = '';
    if (isKo) {
      const selNone  = !merged.penaltyWinner ? 'selected' : '';
      const selHome  = merged.penaltyWinner === m.home ? 'selected' : '';
      const selAway  = merged.penaltyWinner === m.away ? 'selected' : '';
      penaltyOptions = `
        <select class="admin-penalty-select" data-match="${m.id}">
          <option value="" ${selNone}>— penales —</option>
          <option value="${m.home}" ${selHome}>${homeTeam.name}</option>
          <option value="${m.away}" ${selAway}>${awayTeam.name}</option>
        </select>`;
    }

    html += `
      <div class="admin-match-row">
        <div class="admin-match-teams">
          <span>${homeTeam.flag}</span>
          <span>${homeTeam.name}</span>
          <span style="color:var(--gray-mid)">vs</span>
          <span>${awayTeam.name}</span>
          <span>${awayTeam.flag}</span>
        </div>
        <span class="admin-match-date">${formatMatchDate(m.date, m.time)}</span>
        <div class="admin-score-inputs">
          <input type="number" class="admin-score-input" min="0" max="99" value="${hScore}" placeholder="–" data-match="${m.id}" data-side="home">
          <span class="admin-dash">-</span>
          <input type="number" class="admin-score-input" min="0" max="99" value="${aScore}" placeholder="–" data-match="${m.id}" data-side="away">
        </div>
        ${penaltyOptions}
        <button class="btn-admin-save" data-match="${m.id}">Guardar</button>
      </div>`;
  }

  list.innerHTML = html || '<p style="color:var(--gray-mid);font-size:13px">No hay partidos en esta etapa.</p>';

  // Attach save listeners
  list.querySelectorAll('.btn-admin-save').forEach(btn => {
    btn.addEventListener('click', async () => {
      const matchId = btn.dataset.match;
      const row = btn.closest('.admin-match-row');
      const hInput = row.querySelector('[data-side="home"]');
      const aInput = row.querySelector('[data-side="away"]');
      const penSel = row.querySelector('.admin-penalty-select');

      const hVal = hInput.value.trim();
      const aVal = aInput.value.trim();

      if (hVal === '' || aVal === '') {
        showToast('Ingresá ambos scores', 'error');
        return;
      }

      const data = {
        homeScore:     parseInt(hVal),
        awayScore:     parseInt(aVal),
        penaltyWinner: penSel?.value || null,
        status:        'finished',
        updatedAt:     firebase.firestore.FieldValue.serverTimestamp(),
      };

      try {
        await db.collection('matches').doc(matchId).set(data, { merge: true });
        State.remoteMatches[matchId] = { ...(State.remoteMatches[matchId] || {}), ...data };
        showToast('✅ Resultado guardado', 'success');
        btn.style.background = 'var(--green)';
        btn.textContent = '✓ Guardado';
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });
  });
}

document.getElementById('admin-stage-filter')?.addEventListener('change', renderAdminMatchList);

/* =========================================================
   ESPN AUTO-SYNC — fetch live scores and write to Firestore
   ========================================================= */

// ESPN abbreviation → our team code
const ESPN_TO_CODE = {
  CAN:'CAN', BIH:'BIH', QAT:'QAT', SUI:'SUI',
  BRA:'BRA', MAR:'MAR', HAI:'HAI', SCO:'SCO',
  USA:'USA', PAR:'PAR', AUS:'AUS', TUR:'TUR',
  GER:'GER', CUW:'CUW', CUR:'CUW',
  CIV:'CIV', ECU:'ECU',
  NED:'NED', HOL:'NED',
  JPN:'JPN', SWE:'SWE', TUN:'TUN',
  BEL:'BEL', EGY:'EGY', IRN:'IRN', NZL:'NZL',
  ESP:'ESP', CPV:'CPV', CVE:'CPV',
  KSA:'KSA', SAU:'KSA',
  URU:'URU',
  FRA:'FRA', SEN:'SEN', IRQ:'IRQ', NOR:'NOR',
  ARG:'ARG', ALG:'ALG', AUT:'AUT', JOR:'JOR',
  POR:'POR', COD:'COD', DRC:'COD', CGO:'COD',
  UZB:'UZB', COL:'COL',
  ENG:'ENG', CRO:'CRO', GHA:'GHA', PAN:'PAN',
  MEX:'MEX', RSA:'RSA', ZAF:'RSA',
  KOR:'KOR', SKO:'KOR', SKR:'KOR',
  CZE:'CZE',
};

// English display name → our team code (fallback when abbreviation doesn't match)
const ESPN_NAME_TO_CODE = {
  'mexico':'MEX', 'south africa':'RSA', 'south korea':'KOR',
  'czech republic':'CZE', 'czechia':'CZE', 'republic of czechia':'CZE',
  'canada':'CAN', 'bosnia & herzegovina':'BIH', 'bosnia and herzegovina':'BIH', 'bosnia':'BIH',
  'qatar':'QAT', 'switzerland':'SUI',
  'brazil':'BRA', 'morocco':'MAR', 'haiti':'HAI', 'scotland':'SCO',
  'usa':'USA', 'united states':'USA', 'united states of america':'USA',
  'paraguay':'PAR', 'australia':'AUS', 'turkey':'TUR', 'türkiye':'TUR',
  'germany':'GER', 'curaçao':'CUW', 'curacao':'CUW',
  "ivory coast":'CIV', "côte d'ivoire":'CIV', "cote d'ivoire":'CIV', 'costa de marfil':'CIV',
  'ecuador':'ECU',
  'netherlands':'NED', 'holland':'NED',
  'japan':'JPN', 'sweden':'SWE', 'tunisia':'TUN',
  'belgium':'BEL', 'egypt':'EGY', 'iran':'IRN', 'new zealand':'NZL',
  'spain':'ESP', 'cape verde':'CPV', 'cabo verde':'CPV',
  'saudi arabia':'KSA', 'uruguay':'URU',
  'france':'FRA', 'senegal':'SEN', 'iraq':'IRQ', 'norway':'NOR',
  'argentina':'ARG', 'algeria':'ALG', 'austria':'AUT', 'jordan':'JOR',
  'portugal':'POR', 'dr congo':'COD', 'democratic republic of the congo':'COD',
  'congo dr':'COD', 'rd congo':'COD',
  'uzbekistan':'UZB', 'colombia':'COL',
  'england':'ENG', 'croatia':'CRO', 'ghana':'GHA', 'panama':'PAN',
};

function resolveESPNTeam(abbreviation, displayName) {
  const abbr = (abbreviation || '').toUpperCase();
  const name = (displayName || '').toLowerCase();
  return ESPN_TO_CODE[abbr] || ESPN_NAME_TO_CODE[name] || null;
}

async function syncScoresFromESPN(showFeedback) {
  const syncBtn    = document.getElementById('btn-espn-sync');
  const syncStatus = document.getElementById('espn-sync-status');

  if (syncBtn) syncBtn.disabled = true;
  if (syncStatus) {
    syncStatus.textContent = 'Sincronizando…';
    syncStatus.style.color = 'var(--yellow)';
  }

  // Query ESPN for all past match dates + today + tomorrow (covers live/late matches)
  const artNow = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const todayStr = artNow.toISOString().slice(0, 10);
  const pastMatchDates = [...new Set(
    MATCHES
      .filter(m => m.date <= todayStr)
      .map(m => m.date.replace(/-/g, ''))
  )];
  // Also include tomorrow in case a match goes past midnight ART
  const tomorrow = new Date(artNow);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10).replace(/-/g, '');
  const dates = [...new Set([...pastMatchDates, tomorrowStr])];

  const FINISHED_STATUSES = new Set([
    'STATUS_FINAL', 'STATUS_FULL_TIME', 'STATUS_FT',
    'STATUS_FULL_PEN', 'STATUS_PENALTY', 'STATUS_AET',
  ]);

  let updated = 0;
  let espnEventsFound = 0;

  try {
    for (const dateStr of dates) {
      let data;
      try {
        const resp = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`
        );
        if (!resp.ok) continue;
        data = await resp.json();
      } catch (_) { continue; }

      const dateKey = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;

      for (const event of (data.events || [])) {
        const comp = event.competitions?.[0];
        if (!comp) continue;

        const statusName = comp.status?.type?.name || event.status?.type?.name || '';
        const isFinished = FINISHED_STATUSES.has(statusName);
        const competitors = comp.competitors || [];
        const homeComp = competitors.find(c => c.homeAway === 'home') || competitors[0];
        const awayComp = competitors.find(c => c.homeAway === 'away') || competitors[1];
        if (!homeComp || !awayComp) continue;

        const espnHome = resolveESPNTeam(homeComp.team?.abbreviation, homeComp.team?.displayName);
        const espnAway = resolveESPNTeam(awayComp.team?.abbreviation, awayComp.team?.displayName);

        // ── FASE DE GRUPOS: buscar por códigos de equipo ──
        if (espnHome && espnAway && isFinished) {
          const groupMatch = MATCHES.find(m =>
            m.stage === 'group' &&
            ((m.home === espnHome && m.away === espnAway) ||
             (m.home === espnAway && m.away === espnHome))
          );
          if (groupMatch) {
            espnEventsFound++;
            let hScore = parseInt(homeComp.score);
            let aScore = parseInt(awayComp.score);
            if (!isNaN(hScore) && !isNaN(aScore)) {
              if (groupMatch.home === espnAway) [hScore, aScore] = [aScore, hScore];
              const existing = State.remoteMatches[groupMatch.id];
              if (!(existing?.status === 'finished' && existing.homeScore === hScore && existing.awayScore === aScore)) {
                try {
                  const payload = { homeScore: hScore, awayScore: aScore, status: 'finished', updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
                  await db.collection('matches').doc(groupMatch.id).set(payload, { merge: true });
                  State.remoteMatches[groupMatch.id] = { ...(State.remoteMatches[groupMatch.id] || {}), ...payload };
                  console.log('[ESPN sync] grupo guardado:', groupMatch.id, espnHome, hScore, '-', aScore, espnAway);
                  updated++;
                } catch (e) { console.error('[ESPN sync] error Firestore (grupo):', groupMatch.id, e); }
              }
            }
            continue;
          }
          if (!MATCHES.find(m => m.stage === 'group' && ((m.home === espnHome && m.away === espnAway) || (m.home === espnAway && m.away === espnHome)))) {
            console.warn('[ESPN sync] grupo no encontrado en fixture:', espnHome, 'vs', espnAway);
          }
        }

        // ── FASE ELIMINATORIA: buscar por fecha y horario ──
        // ESPN event.date es ISO 8601 UTC; nuestros horarios son ART (UTC-3)
        const eventUTC = event.date ? new Date(event.date) : null;
        if (!eventUTC) continue;

        const koSlot = MATCHES.find(m => {
          if (m.stage !== 'knockout') return false;
          if (m.date !== dateKey) return false;
          const [h, min] = m.time.split(':').map(Number);
          const [y, mo, d] = m.date.split('-').map(Number);
          const slotUTC = new Date(Date.UTC(y, mo - 1, d, h + 3, min)); // ART+3 = UTC
          return Math.abs(eventUTC - slotUTC) < 90 * 60 * 1000; // ±90 min
        });

        if (!koSlot) continue;
        espnEventsFound++;

        const payload = {};
        if (espnHome) payload.home = espnHome;
        if (espnAway) payload.away = espnAway;
        if (espnHome) payload.homeLabel = null;
        if (espnAway) payload.awayLabel = null;

        if (isFinished) {
          const hScore = parseInt(homeComp.score);
          const aScore = parseInt(awayComp.score);
          if (!isNaN(hScore) && !isNaN(aScore)) {
            payload.homeScore = hScore;
            payload.awayScore = aScore;
            payload.status = 'finished';
            payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            // Penalty winner (STATUS_FULL_PEN / STATUS_PENALTY)
            if (statusName === 'STATUS_FULL_PEN' || statusName === 'STATUS_PENALTY') {
              const winner = competitors.find(c => c.winner === true);
              if (winner) {
                const winnerCode = resolveESPNTeam(winner.team?.abbreviation, winner.team?.displayName);
                if (winnerCode) payload.penaltyWinner = winnerCode;
              }
            }
          }
        } else {
          payload.status = 'upcoming';
        }

        const existing = State.remoteMatches[koSlot.id] || {};
        const hasChanges = Object.keys(payload).some(k => k !== 'updatedAt' && payload[k] !== existing[k]);
        if (!hasChanges) continue;

        try {
          await db.collection('matches').doc(koSlot.id).set(payload, { merge: true });
          State.remoteMatches[koSlot.id] = { ...existing, ...payload };
          console.log('[ESPN sync] eliminatoria guardada:', koSlot.id, payload.home, payload.homeScore, '-', payload.awayScore, payload.away);
          updated++;
        } catch (e) { console.error('[ESPN sync] error Firestore (ko):', koSlot.id, e); }
      }
    }

    const now = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    if (syncStatus) {
      if (updated > 0) {
        syncStatus.textContent = `✅ ${updated} partido${updated !== 1 ? 's' : ''} actualizado${updated !== 1 ? 's' : ''} · ${now}`;
        syncStatus.style.color = 'var(--green)';
        renderAdminMatchList();
        if (State.currentView === 'jugar') renderMatchesView();
        if (State.currentView === 'posiciones') renderStandings();
      } else if (espnEventsFound === 0) {
        syncStatus.textContent = `ESPN no devolvió partidos finalizados · ${now}`;
        syncStatus.style.color = 'var(--yellow)';
      } else {
        syncStatus.textContent = `Sin cambios nuevos (${espnEventsFound} partidos en ESPN) · ${now}`;
        syncStatus.style.color = 'var(--gray-mid)';
      }
    }
    console.log(`[ESPN sync] eventos ESPN encontrados: ${espnEventsFound}, actualizados: ${updated}`);
    if (showFeedback && updated > 0) {
      showToast(`✅ ${updated} resultado${updated !== 1 ? 's' : ''} sincronizado${updated !== 1 ? 's' : ''}`, 'success');
    }
  } catch (err) {
    const now = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    if (syncStatus) {
      syncStatus.textContent = `Error al conectar con ESPN · ${now}`;
      syncStatus.style.color = 'var(--red)';
    }
  } finally {
    if (syncBtn) syncBtn.disabled = false;
  }
}

document.getElementById('btn-espn-sync')?.addEventListener('click', () => syncScoresFromESPN(true));

/* ---- Corregir fixture en Firestore (sin tocar resultados) ---- */
document.getElementById('btn-update-fixture')?.addEventListener('click', async () => {
  if (!State.isAdmin) return;
  const result = document.getElementById('update-fixture-result');
  const btn    = document.getElementById('btn-update-fixture');
  btn.disabled = true;
  result.textContent = 'Actualizando fixture…';
  result.style.color = 'var(--yellow)';

  try {
    // Firestore batch limit = 500 ops; MATCHES tiene ~104 entradas, seguro en 1 batch
    const batch = db.batch();
    MATCHES.forEach(m => {
      batch.set(db.collection('matches').doc(m.id), {
        // Solo campos de fixture — NO se incluyen homeScore/awayScore/status/penaltyWinner
        home:      m.home      ?? null,
        away:      m.away      ?? null,
        group:     m.group     ?? null,
        matchday:  m.matchday  ?? null,
        date:      m.date,
        time:      m.time,
        stage:     m.stage,
        round:     m.round     ?? null,
        homeLabel: m.homeLabel ?? null,
        awayLabel: m.awayLabel ?? null,
      }, { merge: true });

      // Actualizar caché local para que la UI refleje el cambio de inmediato
      if (State.remoteMatches[m.id]) {
        Object.assign(State.remoteMatches[m.id], {
          home: m.home, away: m.away, group: m.group,
          matchday: m.matchday, date: m.date, time: m.time,
        });
      }
    });
    await batch.commit();

    result.textContent = `✅ ${MATCHES.length} partidos actualizados (resultados intactos)`;
    result.style.color = 'var(--green)';
    showToast('Fixture corregido en Firestore', 'success');
    renderAdminMatchList();
    if (State.currentView === 'jugar') renderMatchesView();
  } catch (err) {
    result.textContent = 'Error: ' + err.message;
    result.style.color = 'var(--red)';
  } finally {
    btn.disabled = false;
  }
});

/* ---- Seed matches to Firestore ---- */
document.getElementById('btn-seed-matches')?.addEventListener('click', async () => {
  if (!State.isAdmin) return;
  const result = document.getElementById('seed-result');
  result.textContent = 'Cargando...';
  result.style.color = 'var(--yellow)';

  const batch = db.batch();
  MATCHES.forEach(m => {
    const ref = db.collection('matches').doc(m.id);
    batch.set(ref, {
      id:            m.id,
      stage:         m.stage,
      group:         m.group  || null,
      matchday:      m.matchday || null,
      round:         m.round  || null,
      date:          m.date,
      time:          m.time,
      home:          m.home   || null,
      away:          m.away   || null,
      homeLabel:     m.homeLabel || null,
      awayLabel:     m.awayLabel || null,
      homeScore:     null,
      awayScore:     null,
      penaltyWinner: null,
      status:        'upcoming',
    }, { merge: true });
  });

  try {
    await batch.commit();
    result.textContent = `✅ ${MATCHES.length} partidos cargados en Firestore`;
    result.style.color = 'var(--green)';
    showToast('Partidos inicializados en la base de datos', 'success');
  } catch (err) {
    result.textContent = 'Error: ' + err.message;
    result.style.color = 'var(--red)';
  }
});

/* =========================================================
   UI HELPERS
   ========================================================= */

function showLoading(show) {
  document.getElementById('loading-overlay').classList.toggle('hidden', !show);
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* =========================================================
   INIT
   ========================================================= */

// Show loading spinner on start (auth check in progress)
showLoading(true);
