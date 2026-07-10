(() => {
  const GAME_ID   = 'blind-countdown';
  const LIVES_MAX = 3;
  const ROUNDS    = 10;

  let state = {};
  let phase = 'idle'; // idle | counting | result
  let tickTimers = [];
  let missTimer  = null;
  let tZero      = 0;

  const livesEl        = document.getElementById('lives');
  const scoreEl        = document.getElementById('score');
  const streakEl       = document.getElementById('streak');
  const timerBar       = document.getElementById('timer-bar');
  const gameArea       = document.getElementById('game-area');
  const roundLabel     = document.getElementById('round-label');
  const countdownDisp  = document.getElementById('countdown-display');
  const statusLabel    = document.getElementById('status-label');
  const errorMs        = document.getElementById('error-ms');
  const endScreen      = document.getElementById('end-screen');
  const endScore       = document.getElementById('end-score');
  const endStreak      = document.getElementById('end-streak');
  const endBest        = document.getElementById('end-best');
  const leaderboardEl  = document.getElementById('leaderboard');

  function clearTimers() {
    tickTimers.forEach(clearTimeout);
    tickTimers = [];
    clearTimeout(missTimer);
    missTimer = null;
  }

  function hideAtFor(round) {
    if (round <= 3) return 6;
    if (round <= 7) return 7;
    return 8;
  }

  function startGame() {
    clearTimers();
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX, round: 0 };
    phase = 'idle';
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    errorMs.textContent = '';
    updateHUD();
    startRound();
  }

  function startRound() {
    state.round++;
    phase = 'counting';
    clearTimers();
    gameArea.className = '';
    roundLabel.textContent  = 'Round ' + state.round + ' of ' + ROUNDS;
    statusLabel.textContent = 'Watch closely…';
    errorMs.textContent = '';
    countdownDisp.textContent = '10';
    countdownDisp.classList.remove('blind');
    updateProgress();

    const tickRate = 400 + Math.random() * 800;
    const hideAt   = hideAtFor(state.round);
    const t0 = performance.now();
    tZero = t0 + tickRate * 10;

    for (let i = 1; i <= 10; i++) {
      const displayVal = 10 - i;
      const delay = t0 + i * tickRate - performance.now();
      const timer = setTimeout(() => {
        if (phase !== 'counting') return;
        if (displayVal < hideAt) {
          countdownDisp.textContent = '❓';
          countdownDisp.classList.add('blind');
          statusLabel.textContent = 'Tap when it hits ZERO!';
        } else {
          countdownDisp.textContent = String(displayVal);
        }
      }, delay);
      tickTimers.push(timer);
    }

    missTimer = setTimeout(() => handleAnswer(null), (tZero - t0) + 1500);
  }

  function handleAnswer(tapTime) {
    if (phase !== 'counting') return;
    phase = 'result';
    clearTimers();
    gameArea.className = '';

    const error = tapTime === null ? Infinity : Math.abs(tapTime - tZero);
    const mult  = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
    let base = 0;

    if (error <= 100)      base = 30;
    else if (error <= 175) base = 20;
    else if (error <= 250) base = 10;

    if (base > 0) {
      const pts = Math.round(base * mult);
      state.score += pts;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      gameArea.className = 'correct';
      statusLabel.textContent = '+' + pts + ' pts' + (state.streak > 1 ? ' 🔥 ' + state.streak : '');
      errorMs.textContent = Math.round(error) + 'ms off';
    } else {
      state.lives--;
      state.streak = 0;
      gameArea.className = 'wrong';
      statusLabel.textContent = tapTime === null ? 'Too slow!' : 'Missed it!';
      errorMs.textContent = tapTime === null ? '' : Math.round(error) + 'ms off';
    }

    updateHUD();
    scheduleNext();
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
  }

  function updateProgress() {
    timerBar.style.transition = 'none';
    timerBar.style.width = ((state.round / ROUNDS) * 100) + '%';
  }

  function endGame() {
    clearTimers();
    gameArea.hidden  = true;
    endScreen.hidden = false;
    gameArea.className = '';

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

  gameArea.addEventListener('click', () => handleAnswer(performance.now()));

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (e.key === ' ') { e.preventDefault(); handleAnswer(performance.now()); }
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
