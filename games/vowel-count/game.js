(() => {
  const GAME_ID   = 'vowel-count';
  const LIVES_MAX = 3;
  const ROUNDS    = 10;
  const SELECT_MS = 6000;

  let state = {};
  let phase = 'idle'; // idle | flashing | choosing | result
  let answered = false;
  let timerInterval = null;
  let judgeStart = 0;
  let flashTimeout = null;

  const livesEl       = document.getElementById('lives');
  const scoreEl       = document.getElementById('score');
  const streakEl      = document.getElementById('streak');
  const timerBar      = document.getElementById('timer-bar');
  const gameArea      = document.getElementById('game-area');
  const roundLabel    = document.getElementById('round-label');
  const yBanner       = document.getElementById('y-banner');
  const wordDisplay   = document.getElementById('word-display');
  const statusLabel   = document.getElementById('status-label');
  const choiceGrid    = document.getElementById('choice-grid');
  const endScreen     = document.getElementById('end-screen');
  const endScore      = document.getElementById('end-score');
  const endStreak     = document.getElementById('end-streak');
  const endBest       = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function tierFor(round) {
    if (round <= 3) return 1;
    if (round <= 7) return 2;
    return 3;
  }

  function flashTimeFor(round) {
    return Math.round(1200 - 800 * (round - 1) / 9);
  }

  function countVowels(word, yCounts) {
    const set = yCounts ? 'AEIOUY' : 'AEIOU';
    return [...word].filter(c => set.includes(c)).length;
  }

  function pickWord(round, yCounts) {
    const tier = tierFor(round);
    let pool = WORDS.filter(w => w.difficulty === tier && (!yCounts || w.word.includes('Y')));
    if (!pool.length && yCounts) pool = WORDS.filter(w => w.word.includes('Y'));
    if (!pool.length) { pool = WORDS.filter(w => w.difficulty === tier); }
    return pool[rand(0, pool.length - 1)];
  }

  function startGame() {
    clearInterval(timerInterval);
    clearTimeout(flashTimeout);
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX, round: 0 };
    phase = 'idle';
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    updateHUD();
    setTimerBar(0);
    nextRound();
  }

  function nextRound() {
    state.round++;
    answered = false;
    phase = 'flashing';
    gameArea.className = '';
    roundLabel.textContent  = 'Round ' + state.round + ' of ' + ROUNDS;
    statusLabel.textContent = 'Watch closely…';
    choiceGrid.innerHTML = '';
    updateProgress();

    let yCounts = state.round >= 4 && Math.random() < 0.35;
    const entry = pickWord(state.round, yCounts);
    yCounts = yCounts && entry.word.includes('Y');

    state.word = entry.word;
    state.yCounts = yCounts;
    state.correctCount = countVowels(entry.word, yCounts);

    yBanner.hidden = !yCounts;
    wordDisplay.textContent = entry.word;
    wordDisplay.classList.remove('hidden-word');

    flashTimeout = setTimeout(() => {
      wordDisplay.classList.add('hidden-word');
      showChoices();
    }, flashTimeFor(state.round));
  }

  function showChoices() {
    phase = 'choosing';
    statusLabel.textContent = 'How many vowels?';

    const correct = state.correctCount;
    const others = new Set([correct]);
    while (others.size < 3) {
      const off = rand(1, 2) * (Math.random() < 0.5 ? 1 : -1);
      const c = correct + off;
      if (c >= 0) others.add(c);
    }
    state.choices = shuffle(Array.from(others));

    choiceGrid.innerHTML = '';
    state.choices.forEach((val, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = val;
      btn.addEventListener('click', () => handleChoice(i, val));
      choiceGrid.appendChild(btn);
    });

    judgeStart = Date.now();
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = 'width ' + SELECT_MS + 'ms linear';
    timerBar.style.width = '0%';

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (Date.now() - judgeStart >= SELECT_MS) {
        clearInterval(timerInterval);
        handleChoice(-1, -1);
      }
    }, 200);
  }

  function handleChoice(i, val) {
    if (answered || phase !== 'choosing') return;
    answered = true;
    clearInterval(timerInterval);
    timerBar.style.transition = 'none';

    const btns = choiceGrid.querySelectorAll('.choice-btn');
    btns.forEach(b => b.disabled = true);

    const revealText = state.word + ' — ' + state.correctCount + ' vowels' + (state.yCounts ? ' (Y counted!)' : '');

    if (val === state.correctCount) {
      const mult = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
      const pts  = Math.round(10 * mult);
      state.score += pts;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      if (i >= 0) btns[i].classList.add('correct');
      gameArea.className = 'correct';
      statusLabel.textContent = 'Correct! +' + pts + ' pts — ' + revealText;
    } else {
      state.lives--;
      state.streak = 0;
      if (i >= 0) btns[i].classList.add('wrong');
      btns.forEach((b, bi) => { if (+b.textContent === state.correctCount) b.classList.add('correct'); });
      gameArea.className = 'wrong';
      statusLabel.textContent = (val === -1 ? 'Time! ' : 'Wrong! ') + revealText;
    }

    updateHUD();
    phase = 'result';

    setTimeout(() => {
      if (state.lives <= 0 || state.round >= ROUNDS) endGame();
      else nextRound();
    }, state.lives <= 0 ? 1800 : 1500);
  }

  function setTimerBar(pct) {
    timerBar.style.transition = 'none';
    timerBar.style.width = pct + '%';
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

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    const map = { '1': 0, '2': 1, '3': 2 };
    if (map[e.key] !== undefined) {
      const btns = choiceGrid.querySelectorAll('.choice-btn');
      if (btns[map[e.key]]) btns[map[e.key]].click();
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
