(() => {
  const GAME_ID    = 'guess-the-price';
  const LIVES_MAX  = 3;
  const ROUNDS     = 10;
  const TIME_LIMIT = 10000;

  let state    = {};
  let products = [];
  let phase    = 'idle'; // idle | active | result
  let answered = false;
  let timerInterval = null;
  let timerStart    = 0;

  const livesEl       = document.getElementById('lives');
  const scoreEl       = document.getElementById('score');
  const streakEl      = document.getElementById('streak');
  const timerBar      = document.getElementById('timer-bar');
  const gameArea      = document.getElementById('game-area');
  const roundLabel    = document.getElementById('round-label');
  const productEmoji  = document.getElementById('product-emoji');
  const productName   = document.getElementById('product-name');
  const productDesc   = document.getElementById('product-desc');
  const thresholdLbl  = document.getElementById('threshold-label');
  const feedbackLabel = document.getElementById('feedback-label');
  const btnCheaper    = document.getElementById('btn-cheaper');
  const btnPricier    = document.getElementById('btn-pricier');
  const endScreen     = document.getElementById('end-screen');
  const endScore      = document.getElementById('end-score');
  const endStreak     = document.getElementById('end-streak');
  const endBest       = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  function fmt(n) {
    return '$' + (Number.isInteger(n) ? n : n.toFixed(2));
  }

  function startGame() {
    clearInterval(timerInterval);
    PlayCounter.increment(GAME_ID);
    products = getProducts(ROUNDS);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX, round: 0 };
    phase = 'active';
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    feedbackLabel.textContent = '';
    feedbackLabel.className   = '';
    btnCheaper.disabled = false;
    btnPricier.disabled = false;
    updateHUD();
    nextItem();
  }

  function nextItem() {
    if (state.round >= ROUNDS) { endGame(); return; }
    const p = products[state.round];
    answered = false;
    phase = 'active';
    gameArea.className        = '';
    feedbackLabel.textContent = '';
    feedbackLabel.className   = '';
    btnCheaper.disabled       = false;
    btnPricier.disabled       = false;

    roundLabel.textContent   = 'Item ' + (state.round + 1) + ' of ' + ROUNDS;
    productEmoji.textContent = p.emoji;
    productName.textContent  = p.name;
    productDesc.textContent  = p.desc;
    thresholdLbl.textContent = 'Is it cheaper or more expensive than ' + fmt(p.threshold) + '?';
    updateProgress();
    startTimerBar();
    timerStart = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (Date.now() - timerStart >= TIME_LIMIT) {
        clearInterval(timerInterval);
        handleGuess(null);
      }
    }, 200);
  }

  function handleGuess(direction) {
    if (answered || phase !== 'active') return;
    answered = true;
    clearInterval(timerInterval);
    stopTimerBar();
    btnCheaper.disabled = true;
    btnPricier.disabled = true;

    const p = products[state.round];
    const elapsed   = Date.now() - timerStart;
    const isCorrect = direction === null ? false
      : (direction === 'cheaper' ? p.actual < p.threshold : p.actual >= p.threshold);

    const actualStr = fmt(p.actual);

    if (direction === null) {
      state.lives--;
      state.streak = 0;
      gameArea.className        = 'wrong';
      feedbackLabel.textContent = 'Time! Actual price: ' + actualStr;
      feedbackLabel.className   = 'wrong';
    } else if (isCorrect) {
      const speedPct = elapsed / TIME_LIMIT;
      const base     = 30;
      const bonus    = speedPct <= 0.4 ? 15 : 0;
      const mult     = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
      const pts      = Math.round((base + bonus) * mult);
      state.score += pts;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      gameArea.className        = 'correct';
      feedbackLabel.textContent = '✓ ' + actualStr + (bonus ? ' ⚡' : '') + ' → +' + pts + ' pts';
      feedbackLabel.className   = 'correct';
    } else {
      state.lives--;
      state.streak = 0;
      gameArea.className        = 'wrong';
      feedbackLabel.textContent = '✗ Actual price was ' + actualStr;
      feedbackLabel.className   = 'wrong';
    }

    state.round++;
    updateHUD();
    phase = 'result';

    setTimeout(() => {
      if (state.lives <= 0) { endGame(); return; }
      nextItem();
    }, state.lives <= 0 ? 1800 : 1800);
  }

  function startTimerBar() {
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = 'width ' + TIME_LIMIT + 'ms linear';
    timerBar.style.width = '0%';
  }

  function stopTimerBar() {
    timerBar.style.transition = 'none';
  }

  function updateProgress() {
    timerBar.style.transition = 'none';
    timerBar.style.width = ((state.round / ROUNDS) * 100) + '%';
  }

  function updateHUD() {
    scoreEl.textContent  = state.score;
    streakEl.textContent = state.streak > 0 ? '🔥 ' + state.streak : '—';
    livesEl.innerHTML    = '❤️'.repeat(state.lives) + '🖤'.repeat(LIVES_MAX - state.lives);
    roundLabel.textContent = 'Item ' + Math.min(state.round + 1, ROUNDS) + ' of ' + ROUNDS;
  }

  function endGame() {
    clearInterval(timerInterval);
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

  btnCheaper.addEventListener('click', () => handleGuess('cheaper'));
  btnPricier.addEventListener('click', () => handleGuess('pricier'));

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (e.key === 'ArrowLeft'  || e.key === 'c') handleGuess('cheaper');
    if (e.key === 'ArrowRight' || e.key === 'm') handleGuess('pricier');
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
