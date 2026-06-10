(() => {
  const GAME_ID       = 'closest-wins';
  const LIVES_MAX     = 3;
  const ROUNDS        = 10;
  const TARGET_SPIN   = 1800; // ms target wheel spins before auto-stop
  const PLAYER_WINDOW = 3000; // ms player has to tap after target stops
  const TICK          = 50;   // ms per number change

  let state = {};
  let phase = 'idle'; // idle | target-spinning | player-spinning | result
  let spinInterval   = null;
  let playerInterval = null;
  let playerTimer    = null;
  let playerNum      = 1;
  let displayNum     = 1;

  const livesEl      = document.getElementById('lives');
  const scoreEl      = document.getElementById('score');
  const streakEl     = document.getElementById('streak');
  const timerBar     = document.getElementById('timer-bar');
  const gameArea     = document.getElementById('game-area');
  const roundLabel   = document.getElementById('round-label');
  const targetWheel  = document.getElementById('target-wheel');
  const playerWheel  = document.getElementById('player-wheel');
  const statusLabel  = document.getElementById('status-label');
  const tapHint      = document.getElementById('tap-hint');
  const endScreen    = document.getElementById('end-screen');
  const endScore     = document.getElementById('end-score');
  const endStreak    = document.getElementById('end-streak');
  const endBest      = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function startGame() {
    clearInterval(spinInterval);
    clearInterval(playerInterval);
    clearTimeout(playerTimer);
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX, round: 0, targetNum: 0 };
    phase = 'idle';
    endScreen.hidden   = true;
    gameArea.hidden    = false;
    gameArea.className = '';
    targetWheel.textContent = '?';
    targetWheel.className   = 'wheel-box';
    playerWheel.textContent = '—';
    playerWheel.className   = 'wheel-box';
    statusLabel.textContent = 'Tap to begin';
    tapHint.textContent     = 'Tap or Space to start';
    updateHUD();
    setTimerBar(0);
  }

  function startRound() {
    state.round++;
    phase = 'target-spinning';
    gameArea.className     = '';
    targetWheel.className  = 'wheel-box spinning';
    playerWheel.className  = 'wheel-box';
    playerWheel.textContent = '—';
    statusLabel.textContent = 'Watch the target wheel…';
    tapHint.textContent     = '';
    updateHUD();
    setTimerBar(0);

    // spin target wheel display
    spinInterval = setInterval(() => {
      targetWheel.textContent = rand(1, 100);
    }, TICK);

    // auto-stop target after TARGET_SPIN ms
    setTimeout(() => {
      clearInterval(spinInterval);
      state.targetNum = rand(1, 100);
      targetWheel.textContent = state.targetNum;
      targetWheel.className   = 'wheel-box stopped';
      startPlayerSpin();
    }, TARGET_SPIN);
  }

  function startPlayerSpin() {
    phase = 'player-spinning';
    statusLabel.textContent = 'Tap to stop!';
    tapHint.textContent     = 'Tap or Space';

    playerNum = rand(1, 100);
    playerWheel.className   = 'wheel-box spinning';

    playerInterval = setInterval(() => {
      playerNum = (playerNum % 100) + 1;
      playerWheel.textContent = playerNum;
    }, TICK);

    // start countdown bar
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = 'width ' + PLAYER_WINDOW + 'ms linear';
    timerBar.style.width = '0%';

    playerTimer = setTimeout(() => stopPlayerWheel(), PLAYER_WINDOW);
  }

  function stopPlayerWheel() {
    if (phase !== 'player-spinning') return;
    clearInterval(playerInterval);
    clearTimeout(playerTimer);
    phase = 'result';

    const stopped = playerNum;
    playerWheel.textContent = stopped;
    playerWheel.className   = 'wheel-box';
    tapHint.textContent     = '';
    timerBar.style.transition = 'none';

    const dist = Math.abs(stopped - state.targetNum);
    const pts  = Math.max(0, Math.round(100 - dist * 2));
    const mult = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
    const final = Math.round(pts * mult);

    if (dist > 30) {
      state.lives--;
      state.streak = 0;
      playerWheel.classList.add('far');
      gameArea.className = 'wrong';
      statusLabel.textContent = 'Off by ' + dist + '! −1 life (0 pts)';
    } else {
      state.score += final;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      playerWheel.classList.add('close');
      gameArea.className = 'correct';
      statusLabel.textContent = 'Off by ' + dist + ' → +' + final + ' pts' + (dist === 0 ? ' 🎯' : '');
    }

    updateHUD();
    setTimeout(() => {
      if (state.lives <= 0 || state.round >= ROUNDS) { endGame(); return; }
      gameArea.className = '';
      startRound();
    }, state.lives <= 0 ? 1800 : 1500);
  }

  function setTimerBar(pct) {
    timerBar.style.transition = 'none';
    timerBar.style.width = pct + '%';
  }

  function updateHUD() {
    scoreEl.textContent  = state.score;
    streakEl.textContent = state.streak > 0 ? '🔥 ' + state.streak : '—';
    livesEl.innerHTML    = '❤️'.repeat(state.lives) + '🖤'.repeat(LIVES_MAX - state.lives);
    roundLabel.textContent = 'Round ' + state.round + ' of ' + ROUNDS;
  }

  function endGame() {
    clearInterval(spinInterval);
    clearInterval(playerInterval);
    clearTimeout(playerTimer);
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
    if (phase === 'idle')           startRound();
    else if (phase === 'player-spinning') stopPlayerWheel();
  });

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      if (phase === 'idle')             startRound();
      else if (phase === 'player-spinning') stopPlayerWheel();
    }
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
