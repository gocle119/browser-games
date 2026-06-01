(() => {
  const GAME_ID   = 'reaction-time';
  const LIVES_MAX = 3;
  const ROUNDS    = 10;
  const TIMEOUT   = 2000;

  let state = {};
  let phase = 'idle'; // idle | waiting | active | result
  let waitTimer = null;
  let tapTimer  = null;

  const livesEl     = document.getElementById('lives');
  const scoreEl     = document.getElementById('score');
  const streakEl    = document.getElementById('streak');
  const timerBar    = document.getElementById('timer-bar');
  const gameArea    = document.getElementById('game-area');
  const roundLabel  = document.getElementById('round-label');
  const statusLabel = document.getElementById('status-label');
  const reactionMs  = document.getElementById('reaction-ms');
  const endScreen   = document.getElementById('end-screen');
  const endScore    = document.getElementById('end-score');
  const endStreak   = document.getElementById('end-streak');
  const endBest     = document.getElementById('end-best');
  const endAvg      = document.getElementById('end-avg');
  const leaderboardEl = document.getElementById('leaderboard');

  function startGame() {
    clearTimeout(waitTimer);
    clearTimeout(tapTimer);
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX, round: 0, times: [] };
    phase = 'idle';
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    roundLabel.textContent  = 'Round 1 of ' + ROUNDS;
    statusLabel.textContent = 'Tap anywhere to begin';
    reactionMs.textContent  = '';
    updateHUD();
    updateProgress();
  }

  function startRound() {
    state.round++;
    phase = 'waiting';
    gameArea.className      = '';
    statusLabel.textContent = 'Get ready…';
    reactionMs.textContent  = '';
    updateProgress();
    waitTimer = setTimeout(goActive, 1500 + Math.random() * 2500);
  }

  function goActive() {
    phase = 'active';
    state.tapStart = Date.now();
    gameArea.className      = 'go';
    statusLabel.textContent = 'TAP!';
    tapTimer = setTimeout(() => handleTap('timeout'), TIMEOUT);
  }

  function handleTap(type) {
    if (phase === 'idle') { startRound(); return; }

    if (phase === 'waiting') {
      clearTimeout(waitTimer);
      phase = 'result';
      state.lives--;
      state.streak = 0;
      gameArea.className      = 'wrong';
      statusLabel.textContent = 'Too early! −1 life';
      reactionMs.textContent  = '';
      updateHUD();
      scheduleNext();
      return;
    }

    if (phase === 'active') {
      clearTimeout(tapTimer);
      const rt = Date.now() - state.tapStart;
      phase = 'result';

      if (type === 'timeout') {
        state.lives--;
        state.streak = 0;
        gameArea.className      = 'wrong';
        statusLabel.textContent = 'Too slow!';
        reactionMs.textContent  = 'Timed out';
      } else {
        const base = rtToPoints(rt);
        const mult = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
        const pts  = Math.round(base * mult);
        state.score += pts;
        state.streak++;
        state.bestStreak = Math.max(state.bestStreak, state.streak);
        state.times.push(rt);
        gameArea.className = 'correct';
        let msg = '+' + pts + ' pts';
        if (state.streak > 1) msg += ' 🔥 ' + state.streak;
        statusLabel.textContent = msg;
        reactionMs.textContent  = rt + 'ms' + (rt < 200 ? ' ⚡' : '');
      }

      updateHUD();
      scheduleNext();
    }
  }

  function rtToPoints(ms) {
    if (ms < 200) return 100;
    if (ms < 250) return 85;
    if (ms < 300) return 70;
    if (ms < 400) return 55;
    if (ms < 500) return 40;
    return 25;
  }

  function scheduleNext() {
    const delay = state.lives <= 0 ? 1800 : 1500;
    setTimeout(() => {
      if (state.lives <= 0 || state.round >= ROUNDS) endGame();
      else startRound();
    }, delay);
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
    gameArea.hidden   = true;
    endScreen.hidden  = false;
    gameArea.className = '';

    Scores.saveScore(GAME_ID, state.score, state.bestStreak);
    const pb    = Scores.getPersonalBest(GAME_ID);
    const board = Scores.getLeaderboard(GAME_ID, 5);

    endScore.textContent  = state.score;
    endStreak.textContent = state.bestStreak;
    endBest.textContent   = pb;

    if (state.times.length) {
      const avg = Math.round(state.times.reduce((a, b) => a + b, 0) / state.times.length);
      endAvg.textContent = 'Avg reaction: ' + avg + 'ms';
    } else {
      endAvg.textContent = 'Here\'s how you did';
    }

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

  gameArea.addEventListener('click', () => handleTap('tap'));

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (e.key === ' ') { e.preventDefault(); handleTap('tap'); }
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
