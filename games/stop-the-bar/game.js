(() => {
  const GAME_ID   = 'stop-the-bar';
  const LIVES_MAX = 3;
  const ROUNDS    = 10;
  const ZONE_CENTER = 0.5;
  const DIFFICULTIES = [
    { duration: 3000, zoneHalf: 0.14 }, // rounds 1–3
    { duration: 2200, zoneHalf: 0.11 }, // rounds 4–6
    { duration: 1600, zoneHalf: 0.08 }, // rounds 7–10
  ];

  let state = {};
  let animFrame  = null;
  let sweepStart = null;
  let diff       = null;
  let phase = 'sweeping'; // sweeping | result

  const livesEl       = document.getElementById('lives');
  const scoreEl       = document.getElementById('score');
  const streakEl      = document.getElementById('streak');
  const timerBar      = document.getElementById('timer-bar');
  const barFill       = document.getElementById('bar-fill');
  const zoneMarker    = document.getElementById('zone-marker');
  const gameArea      = document.getElementById('game-area');
  const roundLabel    = document.getElementById('round-label');
  const feedbackLabel = document.getElementById('feedback-label');
  const endScreen     = document.getElementById('end-screen');
  const endScore      = document.getElementById('end-score');
  const endStreak     = document.getElementById('end-streak');
  const endBest       = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  function getDiff(round) {
    if (round <= 3) return DIFFICULTIES[0];
    if (round <= 6) return DIFFICULTIES[1];
    return DIFFICULTIES[2];
  }

  function startGame() {
    cancelAnimationFrame(animFrame);
    animFrame = null;
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX, round: 0 };
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    feedbackLabel.textContent = '';
    updateHUD();
    updateProgress();
    startRound();
  }

  function startRound() {
    state.round++;
    phase = 'sweeping';
    gameArea.className        = '';
    feedbackLabel.textContent = '';
    diff = getDiff(state.round);
    updateHUD();
    updateProgress();

    // Position zone marker
    const zoneLeft  = (ZONE_CENTER - diff.zoneHalf) * 100;
    const zoneWidth = diff.zoneHalf * 2 * 100;
    zoneMarker.style.left  = zoneLeft + '%';
    zoneMarker.style.width = zoneWidth + '%';

    barFill.style.width = '0%';
    sweepStart = Date.now();
    animFrame  = requestAnimationFrame(sweepFrame);
  }

  function sweepFrame() {
    const pos = (Date.now() - sweepStart) / diff.duration;
    if (pos >= 1.0) {
      barFill.style.width = '100%';
      handleStop(1.0);
      return;
    }
    barFill.style.width = (pos * 100) + '%';
    animFrame = requestAnimationFrame(sweepFrame);
  }

  function handleStop(pos) {
    if (phase !== 'sweeping') return;
    cancelAnimationFrame(animFrame);
    animFrame = null;
    phase = 'result';

    const zoneStart = ZONE_CENTER - diff.zoneHalf;
    const zoneEnd   = ZONE_CENTER + diff.zoneHalf;
    const hit = pos >= zoneStart && pos <= zoneEnd;

    if (hit) {
      const distRatio = Math.abs(pos - ZONE_CENTER) / diff.zoneHalf; // 0=bull, 1=edge
      const base = Math.round(100 - distRatio * 50);
      const mult = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
      const pts  = Math.round(base * mult);
      state.score += pts;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      gameArea.className = 'hit';
      feedbackLabel.textContent = '+' + pts + ' pts' + (distRatio < 0.15 ? ' 🎯' : '');
    } else {
      state.lives--;
      state.streak = 0;
      gameArea.className = 'miss';
      feedbackLabel.textContent = pos >= 1.0 ? 'Time out!' : pos < zoneStart ? 'Too early!' : 'Too late!';
    }

    updateHUD();
    setTimeout(() => {
      if (state.lives <= 0 || state.round >= ROUNDS) endGame();
      else startRound();
    }, state.lives <= 0 ? 1800 : 1300);
  }

  function tap() {
    if (phase !== 'sweeping') return;
    const pos = Math.min((Date.now() - sweepStart) / diff.duration, 1.0);
    handleStop(pos);
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
    cancelAnimationFrame(animFrame);
    animFrame = null;
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

  gameArea.addEventListener('click', tap);

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (e.key === ' ') { e.preventDefault(); tap(); }
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
