(() => {
  const GAME_ID    = 'tile-flash';
  const LIVES_MAX  = 3;
  const GRID_SIZE  = 16;
  const FLASH_MS   = 1200;

  let state = {};
  let phase = 'idle'; // idle | flashing | selecting | result
  let flashTimer = null;

  const livesEl      = document.getElementById('lives');
  const scoreEl      = document.getElementById('score');
  const levelHudEl   = document.getElementById('level-hud');
  const timerBar     = document.getElementById('timer-bar');
  const gameArea     = document.getElementById('game-area');
  const statusLabel  = document.getElementById('status-label');
  const tileGrid     = document.getElementById('tile-grid');
  const progressLbl  = document.getElementById('progress-label');
  const endScreen    = document.getElementById('end-screen');
  const endScore     = document.getElementById('end-score');
  const endStreak    = document.getElementById('end-streak');
  const endBest      = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  let tiles = [];

  function buildGrid() {
    tileGrid.innerHTML = '';
    tiles = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      const el = document.createElement('div');
      el.className = 'flash-tile';
      el.addEventListener('click', () => tapTile(i));
      tileGrid.appendChild(el);
      tiles.push(el);
    }
  }

  function startGame() {
    clearTimeout(flashTimer);
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX, level: 3,
              flashSet: [], tappedSet: [] };
    phase = 'idle';
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    buildGrid();
    statusLabel.textContent = 'Tap to begin';
    progressLbl.textContent = '';
    updateHUD();
    setTimerBar(0);
  }

  function startRound() {
    // pick random tiles to flash
    state.flashSet  = pickN(GRID_SIZE, state.level);
    state.tappedSet = [];
    phase = 'flashing';
    gameArea.className = '';
    progressLbl.textContent = '';

    // reset all tiles
    tiles.forEach(t => { t.className = 'flash-tile'; });
    tileGrid.className = 'locked';
    statusLabel.textContent = 'Remember these…';

    // start flash timer bar
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = 'width ' + FLASH_MS + 'ms linear';
    timerBar.style.width = '0%';

    // light up the flash set
    state.flashSet.forEach(i => tiles[i].classList.add('lit'));

    flashTimer = setTimeout(() => {
      // hide
      state.flashSet.forEach(i => tiles[i].classList.remove('lit'));
      startSelecting();
    }, FLASH_MS);
  }

  function startSelecting() {
    phase = 'selecting';
    tileGrid.className = '';
    statusLabel.textContent = 'Tap the ' + state.level + ' tiles!';
    timerBar.style.transition = 'none';
    timerBar.style.width = '0%';
    updateProgress();
  }

  function tapTile(i) {
    if (phase !== 'selecting') return;
    if (state.tappedSet.includes(i)) return;

    const correct = state.flashSet.includes(i);
    state.tappedSet.push(i);
    tiles[i].classList.add(correct ? 'correct' : 'wrong');

    if (!correct) {
      // mistake
      state.lives--;
      state.streak = 0;
      phase = 'result';
      tileGrid.className = 'locked';
      // reveal all targets
      state.flashSet.forEach(idx => {
        if (!tiles[idx].classList.contains('correct')) tiles[idx].classList.add('lit');
      });
      statusLabel.textContent = 'Wrong tile! −1 life';
      gameArea.className = 'wrong';
      updateHUD();
      setTimeout(() => {
        if (state.lives <= 0) { endGame(); return; }
        gameArea.className = '';
        startRound();
      }, 1500);
      return;
    }

    updateProgress();
    if (state.tappedSet.length >= state.level) {
      // all correct
      phase = 'result';
      tileGrid.className = 'locked';
      const mult = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
      const pts  = Math.round(state.level * 15 * mult);
      state.score += pts;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      state.level++;
      statusLabel.textContent = '+' + pts + ' pts ✓ Next: ' + state.level + ' tiles';
      gameArea.className = 'correct';
      updateHUD();
      setTimeout(() => {
        gameArea.className = '';
        startRound();
      }, 1200);
    }
  }

  function updateProgress() {
    progressLbl.textContent = state.tappedSet.filter(i => state.flashSet.includes(i)).length + ' / ' + state.level;
  }

  function pickN(total, n) {
    const all = Array.from({ length: total }, (_, i) => i);
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.slice(0, n);
  }

  function setTimerBar(pct) {
    timerBar.style.transition = 'none';
    timerBar.style.width = pct + '%';
  }

  function updateHUD() {
    scoreEl.textContent   = state.score;
    levelHudEl.textContent = state.level;
    livesEl.innerHTML     = '❤️'.repeat(state.lives) + '🖤'.repeat(LIVES_MAX - state.lives);
  }

  function endGame() {
    clearTimeout(flashTimer);
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

  gameArea.addEventListener('click', e => {
    if (phase === 'idle' && (e.target === gameArea || e.target === statusLabel || e.target === progressLbl)) {
      startRound();
    }
  });

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (phase === 'idle' && e.key === ' ') { e.preventDefault(); startRound(); }
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
