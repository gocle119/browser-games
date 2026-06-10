(() => {
  const GAME_ID      = 'dont-tap-red';
  const LIVES_MAX    = 3;
  const LIFETIME     = 2000;  // ms a circle lives
  const RED_CHANCE   = 0.15;  // probability a spawned circle is red
  const CIRCLE_SIZE  = 64;    // px

  let state    = {};
  let running  = false;
  let spawnTimer  = null;
  let timerInterval = null;
  let circles  = {}; // id → { el, timeout, isRed }
  let nextId   = 0;

  const livesEl    = document.getElementById('lives');
  const scoreEl    = document.getElementById('score');
  const streakEl   = document.getElementById('streak');
  const timerBar   = document.getElementById('timer-bar');
  const gameArea   = document.getElementById('game-area');
  const greensLbl  = document.getElementById('greens-label');
  const startPrompt = document.getElementById('start-prompt');
  const endScreen  = document.getElementById('end-screen');
  const endScore   = document.getElementById('end-score');
  const endStreak  = document.getElementById('end-streak');
  const endBest    = document.getElementById('end-best');
  const endReason  = document.getElementById('end-reason');
  const leaderboardEl = document.getElementById('leaderboard');

  function spawnInterval() {
    // base 1200ms, minus 100ms per 10 greens, min 600ms
    return Math.max(600, 1200 - Math.floor(state.greensTapped / 10) * 100);
  }

  function startGame() {
    clearTimeout(spawnTimer);
    clearInterval(timerInterval);
    removeAllCircles();
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX,
              greensTapped: 0, spawnedTotal: 0 };
    running = true;
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    startPrompt.style.display = 'none';
    updateHUD();
    updateTimerBar();
    scheduleSpawn();
  }

  function removeAllCircles() {
    Object.values(circles).forEach(c => {
      clearTimeout(c.timeout);
      if (c.el.parentNode) c.el.parentNode.removeChild(c.el);
    });
    circles = {};
  }

  function scheduleSpawn() {
    if (!running) return;
    spawnTimer = setTimeout(() => {
      spawnCircle();
      scheduleSpawn();
    }, spawnInterval());
  }

  function spawnCircle() {
    if (!running) return;
    const isRed = Math.random() < RED_CHANCE;
    const id    = nextId++;
    const el    = document.createElement('div');
    el.className = 'circle ' + (isRed ? 'red' : 'green');
    el.style.setProperty('--lifetime', LIFETIME + 'ms');
    el.style.width  = CIRCLE_SIZE + 'px';
    el.style.height = CIRCLE_SIZE + 'px';

    // random position (avoid edges)
    const areaW = gameArea.clientWidth  || 320;
    const areaH = gameArea.clientHeight || 400;
    const x = Math.random() * (areaW - CIRCLE_SIZE - 16) + 8;
    const y = Math.random() * (areaH - CIRCLE_SIZE - 40) + 20;
    el.style.left = x + 'px';
    el.style.top  = y + 'px';

    el.addEventListener('click', e => {
      e.stopPropagation();
      handleCircleTap(id, isRed);
    });

    gameArea.appendChild(el);
    state.spawnedTotal++;

    const timeout = setTimeout(() => {
      if (!circles[id]) return;
      // circle expired without being tapped
      if (!isRed) {
        missedGreen(id);
      } else {
        removeCircle(id);
      }
    }, LIFETIME);

    circles[id] = { el, timeout, isRed };
  }

  function handleCircleTap(id, isRed) {
    if (!running || !circles[id]) return;
    clearTimeout(circles[id].timeout);

    if (isRed) {
      removeCircle(id);
      endGame('You tapped red! 🔴');
      return;
    }

    // green tap
    removeCircle(id);
    const mult = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
    const pts  = Math.round(10 * mult);
    state.score += pts;
    state.streak++;
    state.greensTapped++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    updateHUD();
    updateTimerBar();
  }

  function missedGreen(id) {
    if (!running) return;
    removeCircle(id);
    state.lives--;
    state.streak = 0;
    gameArea.className = 'flash-red';
    setTimeout(() => { if (running) gameArea.className = ''; }, 300);
    updateHUD();
    if (state.lives <= 0) endGame('Out of lives');
  }

  function removeCircle(id) {
    if (!circles[id]) return;
    if (circles[id].el.parentNode) circles[id].el.parentNode.removeChild(circles[id].el);
    delete circles[id];
  }

  function updateHUD() {
    scoreEl.textContent  = state.score;
    streakEl.textContent = state.streak > 0 ? '🔥 ' + state.streak : '—';
    livesEl.innerHTML    = '❤️'.repeat(state.lives) + '🖤'.repeat(LIVES_MAX - state.lives);
    greensLbl.textContent = state.greensTapped + ' tapped';
  }

  function updateTimerBar() {
    // show fill level as indicator of speed tier (max 6 tiers)
    const tier    = Math.min(Math.floor(state.greensTapped / 10), 6);
    const pct     = (tier / 6) * 100;
    timerBar.style.transition = 'width 0.4s ease';
    timerBar.style.width = pct + '%';
  }

  function endGame(reason) {
    running = false;
    clearTimeout(spawnTimer);
    clearInterval(timerInterval);
    removeAllCircles();
    gameArea.hidden  = true;
    endScreen.hidden = false;

    endReason.textContent = reason || 'Here\'s how you did';
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

  document.getElementById('btn-start').addEventListener('click', startGame);
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
})();
