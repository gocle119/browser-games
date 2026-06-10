(() => {
  const GAME_ID   = 'double-tap';
  const LIVES_MAX = 3;
  const ROUNDS    = 10;

  // circle diameter by streak tier
  const SIZES = [60, 48, 36];

  let state = {};
  let phase = 'idle'; // idle | showing | result
  let roundTimer = null;
  let roundStart = null;

  const livesEl      = document.getElementById('lives');
  const scoreEl      = document.getElementById('score');
  const streakEl     = document.getElementById('streak');
  const timerBar     = document.getElementById('timer-bar');
  const gameArea     = document.getElementById('game-area');
  const roundLabel   = document.getElementById('round-label');
  const statusLabel  = document.getElementById('status-label');
  const circlesLayer = document.getElementById('circles-layer');
  const endScreen    = document.getElementById('end-screen');
  const endScore     = document.getElementById('end-score');
  const endStreak    = document.getElementById('end-streak');
  const endBest      = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  function timeLimit() {
    if (state.round < 4) return 3000;
    if (state.round < 7) return 2500;
    return 2000;
  }

  function circleSize() {
    if (state.streak >= 10) return SIZES[2];
    if (state.streak >= 5)  return SIZES[1];
    return SIZES[0];
  }

  function startGame() {
    clearTimeout(roundTimer);
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX, round: 0, tapped: 0 };
    phase = 'idle';
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    circlesLayer.innerHTML = '';
    statusLabel.textContent = 'Tap to begin';
    updateHUD();
    updateProgress();
  }

  function startRound() {
    state.round++;
    state.tapped = 0;
    phase = 'showing';
    gameArea.className = '';
    circlesLayer.innerHTML = '';
    statusLabel.textContent = 'Tap both!';
    updateHUD();
    updateProgress();
    placeCircles();
    roundStart = Date.now();
    startTimerBar();
    roundTimer = setTimeout(() => roundEnd(false), timeLimit());
  }

  function placeCircles() {
    const areaW = gameArea.clientWidth  || 320;
    const areaH = gameArea.clientHeight || 400;
    const size  = circleSize();
    const pad   = size / 2 + 16;
    const positions = generateTwoPositions(areaW, areaH, pad, size);

    positions.forEach((pos, i) => {
      const el = document.createElement('div');
      el.className = 'tap-circle';
      el.style.width  = size + 'px';
      el.style.height = size + 'px';
      el.style.left   = pos.x + 'px';
      el.style.top    = pos.y + 'px';
      el.textContent  = i === 0 ? '1' : '2';
      el.addEventListener('click', e => { e.stopPropagation(); tapCircle(el); });
      circlesLayer.appendChild(el);
    });
  }

  function generateTwoPositions(w, h, pad, size) {
    const minDist = size * 2.5;
    let p1, p2, attempts = 0;
    do {
      p1 = { x: rand(pad, w - pad), y: rand(pad, h - pad) };
      p2 = { x: rand(pad, w - pad), y: rand(pad, h - pad) };
      attempts++;
    } while (dist(p1, p2) < minDist && attempts < 30);
    return [p1, p2];
  }

  function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function tapCircle(el) {
    if (phase !== 'showing') return;
    if (el.classList.contains('tapped')) return;
    el.classList.add('tapped');
    state.tapped++;
    if (state.tapped >= 2) {
      clearTimeout(roundTimer);
      roundEnd(true);
    }
  }

  function roundEnd(success) {
    if (phase !== 'showing') return;
    phase = 'result';
    stopTimerBar();

    if (success) {
      const elapsed  = Date.now() - roundStart;
      const limit    = timeLimit();
      const speedPct = elapsed / limit;
      const base     = 80;
      const bonus    = speedPct <= 0.5 ? 40 : 0;
      const mult     = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
      const pts      = Math.round((base + bonus) * mult);
      state.score += pts;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      gameArea.className = 'correct';
      statusLabel.textContent = '+' + pts + ' pts' + (bonus ? ' ⚡' : '') + (state.streak > 1 ? ' 🔥' + state.streak : '');
    } else {
      state.lives--;
      state.streak = 0;
      gameArea.className = 'wrong';
      statusLabel.textContent = 'Too slow! −1 life';
      // remove any un-tapped circles
      circlesLayer.innerHTML = '';
    }

    updateHUD();
    setTimeout(() => {
      if (state.lives <= 0 || state.round >= ROUNDS) { endGame(); return; }
      startRound();
    }, state.lives <= 0 ? 1800 : 1400);
  }

  function startTimerBar() {
    const limit = timeLimit();
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = 'width ' + limit + 'ms linear';
    timerBar.style.width = '0%';
  }

  function stopTimerBar() {
    timerBar.style.transition = 'none';
  }

  function updateHUD() {
    scoreEl.textContent  = state.score;
    streakEl.textContent = state.streak > 0 ? '🔥 ' + state.streak : '—';
    livesEl.innerHTML    = '❤️'.repeat(state.lives) + '🖤'.repeat(LIVES_MAX - state.lives);
    roundLabel.textContent = 'Round ' + state.round + ' of ' + ROUNDS;
  }

  function updateProgress() {
    timerBar.style.transition = 'none';
    timerBar.style.width = ((state.round / ROUNDS) * 100) + '%';
  }

  function endGame() {
    gameArea.hidden  = true;
    endScreen.hidden = false;

    Scores.saveScore(GAME_ID, state.score, state.bestStreak);
    const pb    = Scores.getPersonalBest(GAME_ID);
    const board = Scores.getLeaderboard(GAME_ID, 5);

    endScore.textContent  = state.score;
    endStreak.textContent = state.bestStreak;
    endBest.textContent   = pb;

    const nameInput = document.getElementById('player-name');
    nameInput.value = localStorage.getItem('player_name') || '';
    const submitBtn = document.getElementById('btn-submit-score');
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Submit';
    renderGlobalLeaderboard();

    leaderboardEl.innerHTML = board.map((e, i) =>
      '<div class="lb-row ' + (i === 0 ? 'lb-top' : '') + '">' +
        '<span class="lb-rank">' + (i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)) + '</span>' +
        '<span class="lb-score">' + e.score + '</span>' +
        '<span class="lb-meta">streak ' + e.streak + ' · ' + e.date + '</span>' +
      '</div>'
    ).join('');
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderGlobalLeaderboard() {
    const el = document.getElementById('global-leaderboard');
    el.innerHTML = '<div class="lb-loading">Loading…</div>';
    PlayCounter.getTopScores(GAME_ID).then(entries => {
      if (!entries.length) { el.innerHTML = '<div class="lb-loading">No scores yet — be first!</div>'; return; }
      el.innerHTML = entries.map((e, i) =>
        '<div class="lb-row ' + (i === 0 ? 'lb-top' : '') + '">' +
          '<span class="lb-rank">' + (i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)) + '</span>' +
          '<span class="lb-name">' + escapeHtml(e.name) + '</span>' +
          '<span class="lb-score">' + e.score + '</span>' +
          '<span class="lb-meta">streak ' + e.streak + ' · ' + e.date + '</span>' +
        '</div>'
      ).join('');
    });
  }

  gameArea.addEventListener('click', () => {
    if (phase === 'idle') startRound();
  });

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (e.key === ' ' && phase === 'idle') { e.preventDefault(); startRound(); }
  });

  document.getElementById('btn-play-again').addEventListener('click', startGame);

  document.getElementById('btn-submit-score').addEventListener('click', () => {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    localStorage.setItem('player_name', name);
    const btn = document.getElementById('btn-submit-score');
    btn.disabled    = true;
    btn.textContent = 'Saved!';
    PlayCounter.submitScore(GAME_ID, name, state.score, state.bestStreak)
      .then(renderGlobalLeaderboard);
  });

  startGame();
})();
