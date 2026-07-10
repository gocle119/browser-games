(() => {
  const GAME_ID   = 'level-check';
  const LIVES_MAX = 3;
  const ROUNDS    = 10;
  const TIME_MS   = 5000;
  const COLORS    = ['#f1f5f9', '#f59e0b', '#38bdf8', '#f472b6', '#a3e635'];

  let state = {};
  let phase = 'idle'; // idle | judging | result
  let answered = false;
  let timerInterval = null;
  let timerStart = 0;

  const livesEl       = document.getElementById('lives');
  const scoreEl       = document.getElementById('score');
  const streakEl      = document.getElementById('streak');
  const timerBar      = document.getElementById('timer-bar');
  const gameArea      = document.getElementById('game-area');
  const roundLabel    = document.getElementById('round-label');
  const lineStage     = document.getElementById('line-stage');
  const targetLine    = document.getElementById('target-line');
  const horizonLine    = document.getElementById('horizon-line');
  const statusLabel   = document.getElementById('status-label');
  const btnLevel      = document.getElementById('btn-level');
  const btnTilted     = document.getElementById('btn-tilted');
  const endScreen     = document.getElementById('end-screen');
  const endScore      = document.getElementById('end-score');
  const endStreak     = document.getElementById('end-streak');
  const endBest       = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function angleMaxFor(round) {
    return 6 - 5.5 * (round - 1) / 9;
  }

  function startGame() {
    clearInterval(timerInterval);
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX, round: 0 };
    phase = 'idle';
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    updateHUD();
    nextRound();
  }

  function nextRound() {
    state.round++;
    answered = false;
    phase = 'judging';
    gameArea.className = '';
    roundLabel.textContent  = 'Round ' + state.round + ' of ' + ROUNDS;
    statusLabel.textContent = 'Level or tilted?';
    btnLevel.disabled = false;
    btnTilted.disabled = false;
    btnLevel.className = 'choice-btn';
    btnTilted.className = 'choice-btn';

    const angleMax = angleMaxFor(state.round);
    const isTilted = Math.random() < 0.5;
    const angle = isTilted ? angleMax * (Math.random() < 0.5 ? 1 : -1) : 0;
    state.isTilted = isTilted;
    state.angle = angle;

    const stageW = lineStage.clientWidth  || 300;
    const stageH = lineStage.clientHeight || 240;
    const length = Math.min(260, Math.max(120, stageW * 0.6));
    const left = rand(0, Math.max(0, stageW - length));
    const top  = rand(stageH * 0.2, stageH * 0.8);

    targetLine.style.width = length + 'px';
    targetLine.style.left  = left + 'px';
    targetLine.style.top   = top + 'px';
    targetLine.style.background = pick(COLORS);
    targetLine.style.transform = 'translateY(-50%) rotate(' + angle + 'deg)';

    if (state.round >= 6) {
      const horizonAngle = rand(1, 3) * (Math.random() < 0.5 ? 1 : -1);
      horizonLine.style.transform = 'translateY(-50%) rotate(' + horizonAngle + 'deg)';
      horizonLine.hidden = false;
    } else {
      horizonLine.hidden = true;
    }

    timerStart = Date.now();
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = 'width ' + TIME_MS + 'ms linear';
    timerBar.style.width = '0%';

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!answered && Date.now() - timerStart >= TIME_MS) {
        clearInterval(timerInterval);
        handleAnswer(null);
      }
    }, 200);
  }

  function handleAnswer(choice) {
    if (answered || phase !== 'judging') return;
    answered = true;
    clearInterval(timerInterval);
    timerBar.style.transition = 'none';
    btnLevel.disabled = true;
    btnTilted.disabled = true;

    const correctChoice = state.isTilted ? 'tilted' : 'level';
    const correct = choice === correctChoice;
    const btn = choice === 'level' ? btnLevel : choice === 'tilted' ? btnTilted : null;
    const revealText = state.isTilted
      ? 'It was tilted ' + Math.abs(state.angle).toFixed(1) + '°'
      : 'It was level';

    if (correct) {
      const mult = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
      const pts  = Math.round(10 * mult);
      state.score += pts;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      if (btn) btn.classList.add('correct');
      gameArea.className = 'correct';
      statusLabel.textContent = 'Correct! +' + pts + ' pts';
    } else {
      state.lives--;
      state.streak = 0;
      if (btn) btn.classList.add('wrong');
      (correctChoice === 'level' ? btnLevel : btnTilted).classList.add('correct');
      gameArea.className = 'wrong';
      statusLabel.textContent = (choice === null ? 'Time! ' : 'Wrong! ') + revealText;
    }

    updateHUD();
    phase = 'result';

    setTimeout(() => {
      if (state.lives <= 0 || state.round >= ROUNDS) endGame();
      else nextRound();
    }, state.lives <= 0 ? 1800 : 1500);
  }

  function updateHUD() {
    scoreEl.textContent  = state.score;
    streakEl.textContent = state.streak > 0 ? '🔥 ' + state.streak : '—';
    livesEl.innerHTML    = '❤️'.repeat(state.lives) + '🖤'.repeat(LIVES_MAX - state.lives);
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

  btnLevel.addEventListener('click', () => handleAnswer('level'));
  btnTilted.addEventListener('click', () => handleAnswer('tilted'));

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); handleAnswer('level'); }
    if (e.key === 'ArrowRight') { e.preventDefault(); handleAnswer('tilted'); }
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
