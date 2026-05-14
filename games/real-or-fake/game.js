(() => {
  const GAME_ID = 'real-or-fake';
  const LIVES_MAX = 3;
  const TIME_LIMIT = 5000;
  const SPEED_BONUS_THRESHOLD = 3000;
  const BASE_POINTS = 10;
  const SPEED_BONUS = 5;

  let state = {};
  let timerInterval = null;
  let timerStart = null;
  let answering = false;
  let feedbackTimeout = null;

  // DOM refs
  const wordEl        = document.getElementById('word');
  const livesEl       = document.getElementById('lives');
  const scoreEl       = document.getElementById('score');
  const streakEl      = document.getElementById('streak');
  const timerBar      = document.getElementById('timer-bar');
  const feedbackEl    = document.getElementById('feedback');
  const feedbackText  = document.getElementById('feedback-text');
  const feedbackSub   = document.getElementById('feedback-sub');
  const endScreen     = document.getElementById('end-screen');
  const endScore      = document.getElementById('end-score');
  const endStreak     = document.getElementById('end-streak');
  const endBest       = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');
  const gameArea      = document.getElementById('game-area');
  const btnReal       = document.getElementById('btn-real');
  const btnFake       = document.getElementById('btn-fake');

  function startGame() {
    clearTimeout(feedbackTimeout);
    feedbackTimeout = null;
    PlayCounter.increment(GAME_ID);
    state = {
      words: shuffleWords(),
      index: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      lives: LIVES_MAX,
    };
    endScreen.hidden = true;
    gameArea.hidden = false;
    feedbackEl.hidden = true;
    updateHUD();
    nextWord();
  }

  function nextWord() {
    if (state.index >= state.words.length) {
      endGame();
      return;
    }
    answering = false;
    const entry = state.words[state.index];
    wordEl.textContent = entry.word;
    wordEl.classList.remove('pop');
    void wordEl.offsetWidth; // reflow to restart animation
    wordEl.classList.add('pop');
    btnReal.disabled = false;
    btnFake.disabled = false;
    startTimer();
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerStart = Date.now();
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = `width ${TIME_LIMIT}ms linear`;
    timerBar.style.width = '0%';

    timerInterval = setInterval(() => {
      const elapsed = Date.now() - timerStart;
      if (elapsed >= TIME_LIMIT) {
        clearInterval(timerInterval);
        if (!answering) handleAnswer(null);
      }
    }, 100);
  }

  function handleAnswer(guess) {
    if (answering) return;
    answering = true;
    clearInterval(timerInterval);

    btnReal.disabled = true;
    btnFake.disabled = true;

    const elapsed = Date.now() - timerStart;
    const entry = state.words[state.index];
    const correct = guess === null ? false : (guess === entry.real);

    if (correct) {
      const speedBonus = elapsed < SPEED_BONUS_THRESHOLD ? SPEED_BONUS : 0;
      const multiplier = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
      const points = Math.round((BASE_POINTS + speedBonus) * multiplier);
      state.score += points;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      showFeedback(true, entry, points, speedBonus > 0);
    } else {
      state.lives--;
      state.streak = 0;
      showFeedback(false, entry, 0, false, guess === null);
    }

    updateHUD();
    state.index++;
  }

  function showFeedback(correct, entry, points, speedBonus, timedOut = false) {
    feedbackEl.className = 'feedback-overlay ' + (correct ? 'correct' : 'wrong');
    feedbackEl.hidden = false;

    if (correct) {
      const tag = entry.real ? '✓ Real word!' : '✓ Nice catch — that\'s fake!';
      const detail = entry.real && entry.def ? `"${entry.def}"` : '';
      const bonus = speedBonus ? ' <span class="speed-tag">⚡ Speed bonus!</span>' : '';
      feedbackText.innerHTML = `${tag}${bonus} <span class="pts">+${points}</span>`;
      feedbackSub.textContent = detail;
    } else {
      if (timedOut) {
        feedbackText.innerHTML = `⏱ Time's up! ${entry.real ? 'That was a real word.' : 'That was fake.'}`;
      } else {
        const guessed = entry.real ? 'Fake' : 'Real';
        feedbackText.innerHTML = `✗ It's ${entry.real ? 'real' : 'fake'}! You picked ${guessed}.`;
      }
      feedbackSub.textContent = entry.real && entry.def ? `"${entry.def}"` : '';
      renderLostLife();
    }

    if (state.lives <= 0) {
      feedbackTimeout = setTimeout(endGame, 1800);
    } else {
      feedbackTimeout = setTimeout(() => {
        feedbackEl.hidden = true;
        nextWord();
      }, 1800);
    }
  }

  function renderLostLife() {
    updateHUD();
  }

  function updateHUD() {
    scoreEl.textContent = state.score;
    streakEl.textContent = state.streak > 0 ? `🔥 ${state.streak}` : '—';
    livesEl.innerHTML = '❤️'.repeat(state.lives) + '🖤'.repeat(LIVES_MAX - state.lives);
  }

  function endGame() {
    feedbackEl.hidden = true;
    gameArea.hidden = true;
    endScreen.hidden = false;
    clearInterval(timerInterval);

    Scores.saveScore(GAME_ID, state.score, state.bestStreak);
    const pb = Scores.getPersonalBest(GAME_ID);
    const board = Scores.getLeaderboard(GAME_ID, 5);

    endScore.textContent = state.score;
    endStreak.textContent = state.bestStreak;
    endBest.textContent = pb;

    const nameInput = document.getElementById('player-name');
    nameInput.value = localStorage.getItem('player_name') || '';
    const submitBtn = document.getElementById('btn-submit-score');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
    renderGlobalLeaderboard();

    leaderboardEl.innerHTML = board.map((entry, i) =>
      `<div class="lb-row ${i === 0 ? 'lb-top' : ''}">
        <span class="lb-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
        <span class="lb-score">${entry.score}</span>
        <span class="lb-meta">streak ${entry.streak} · ${entry.date}</span>
      </div>`
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
        `<div class="lb-row ${i === 0 ? 'lb-top' : ''}">
          <span class="lb-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span>
          <span class="lb-name">${escapeHtml(e.name)}</span>
          <span class="lb-score">${e.score}</span>
          <span class="lb-meta">streak ${e.streak} · ${e.date}</span>
        </div>`
      ).join('');
    });
  }

  // Tap feedback overlay to advance immediately
  feedbackEl.addEventListener('click', () => {
    if (feedbackEl.hidden) return;
    clearTimeout(feedbackTimeout);
    feedbackTimeout = null;
    feedbackEl.hidden = true;
    if (state.lives <= 0) endGame();
    else nextWord();
  });

  // Button listeners
  btnReal.addEventListener('click', () => handleAnswer(true));
  btnFake.addEventListener('click', () => handleAnswer(false));

  document.getElementById('btn-play-again').addEventListener('click', startGame);

  document.getElementById('btn-submit-score').addEventListener('click', () => {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    localStorage.setItem('player_name', name);
    const btn = document.getElementById('btn-submit-score');
    btn.disabled = true;
    btn.textContent = 'Saved!';
    PlayCounter.submitScore(GAME_ID, name, state.score, state.bestStreak)
      .then(renderGlobalLeaderboard);
  });

  // Keyboard support (desktop)
  document.addEventListener('keydown', (e) => {
    if (endScreen.hidden === false) {
      if (e.key === 'Enter' || e.key === ' ') startGame();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'r' || e.key === 'R') handleAnswer(true);
    if (e.key === 'ArrowLeft'  || e.key === 'f' || e.key === 'F') handleAnswer(false);
  });

  startGame();
})();
