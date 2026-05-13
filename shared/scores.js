const Scores = (() => {
  const KEY = (gameId) => `scores_${gameId}`;

  function saveScore(gameId, score, streak) {
    const board = getLeaderboard(gameId, 100);
    board.push({ score, streak, date: new Date().toLocaleDateString() });
    board.sort((a, b) => b.score - a.score);
    localStorage.setItem(KEY(gameId), JSON.stringify(board.slice(0, 100)));
  }

  function getLeaderboard(gameId, limit = 10) {
    try {
      const raw = localStorage.getItem(KEY(gameId));
      const entries = raw ? JSON.parse(raw) : [];
      return entries.slice(0, limit);
    } catch {
      return [];
    }
  }

  function getPersonalBest(gameId) {
    const board = getLeaderboard(gameId, 1);
    return board.length ? board[0].score : 0;
  }

  return { saveScore, getLeaderboard, getPersonalBest };
})();
