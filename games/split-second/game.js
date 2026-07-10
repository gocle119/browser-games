(() => {
  const GAME_ID   = 'split-second';
  const LIVES_MAX = 3;
  const ROUNDS    = 15;
  const INPUT_TIMEOUT = 900;

  let state = {};
  let phase = 'idle'; // idle | flash | input | result
  let flashTimer = null;
  let inputTimer = null;
  let t0 = 0;

  const livesEl       = document.getElementById('lives');
  const scoreEl       = document.getElementById('score');
  const streakEl      = document.getElementById('streak');
  const timerBar      = document.getElementById('timer-bar');
  const gameArea      = document.getElementById('game-area');
  const statusLabel   = document.getElementById('status-label');
  const zoneLeft      = document.getElementById('zone-left');
  const zoneRight     = document.getElementById('zone-right');
  const endScreen     = document.getElementById('end-screen');
  const endScore      = document.getElementById('end-score');
  const endStreak     = document.getElementById('end-streak');
  const endBest       = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  const dot = document.createElement('div');
  dot.className = 'dot';

  function displayTimeFor(round) {
    return Math.round(800 - 550 * Math.min(round - 1, 9) / 9);
  }

  function clearTimers() {
    clearTimeout(flashTimer);
    clearTimeout(inputTimer);
    flashTimer = null;
    inputTimer = null;
  }

  function startGame() {
    clearTimers();
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX, round: 0 };
    phase = 'idle';
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    updateHUD();
    startRound();
  }

  function startRound() {
    state.round++;
    phase = 'flash';
    clearTimers();
    zoneLeft.className  = 'zone';
    zoneRight.className = 'zone';
    statusLabel.textContent = 'Round ' + state.round + ' of ' + ROUNDS;
    updateProgress();

    const side   = Math.random() < 0.5 ? 'left' : 'right';
    const hollow = state.round > 10 && Math.random() < 0.3;
    state.side   = side;
    state.hollow = hollow;

    dot.className = 'dot' + (hollow ? ' hollow' : '');
    dot.hidden = false;
    (side === 'left' ? zoneLeft : zoneRight).appendChild(dot);

    t0 = performance.now();
    const displayTime = displayTimeFor(state.round);

    flashTimer = setTimeout(() => {
      dot.hidden = true;
      phase = 'input';
      inputTimer = setTimeout(() => handleTap(null), INPUT_TIMEOUT);
    }, displayTime);
  }

  function handleTap(sideTapped) {
    if (phase !== 'flash' && phase !== 'input') return;
    phase = 'result';
    clearTimers();

    const responseTime = performance.now() - t0;
    const expected = state.hollow ? (state.side === 'left' ? 'right' : 'left') : state.side;
    const correct  = sideTapped === expected;
    const zone = sideTapped === 'left' ? zoneLeft : sideTapped === 'right' ? zoneRight : null;

    if (correct) {
      const base  = 10 + (responseTime < 400 ? 5 : 0);
      const mult  = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
      const pts   = Math.round(base * mult);
      state.score += pts;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      if (zone) zone.classList.add('correct');
    } else {
      state.lives--;
      state.streak = 0;
      if (zone) zone.classList.add('wrong');
      (expected === 'left' ? zoneLeft : zoneRight).classList.add('correct');
    }

    dot.hidden = true;
    updateHUD();

    setTimeout(() => {
      if (state.lives <= 0 || state.round >= ROUNDS) endGame();
      else startRound();
    }, state.lives <= 0 ? 900 : 500);
  }

  function updateProgress() {
    timerBar.style.transition = 'none';
    timerBar.style.width = ((state.round / ROUNDS) * 100) + '%';
  }

  function updateHUD() {
    scoreEl.textContent  = state.score;
    streakEl.textContent = state.streak > 0 ? '🔥 ' + state.streak : '—';
    livesEl.innerHTML    = '❤️'.repeat(state.lives) + '🖤'.repeat(LIVES_MAX - state.lives);
  }

  function endGame() {
    clearTimers();
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

  zoneLeft.addEventListener('click', () => handleTap('left'));
  zoneRight.addEventListener('click', () => handleTap('right'));

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    const key = e.key.toLowerCase();
    if (key === 'f' || e.key === 'ArrowLeft')  { e.preventDefault(); handleTap('left'); }
    if (key === 'j' || e.key === 'ArrowRight') { e.preventDefault(); handleTap('right'); }
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
