const PlayCounter = (() => {
  const DB = 'https://word-vault-f4a2d-default-rtdb.firebaseio.com';

  async function increment(gameId) {
    try {
      const r = await fetch(`${DB}/plays/${gameId}.json`);
      const cur = await r.json();
      await fetch(`${DB}/plays/${gameId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify((cur || 0) + 1),
      });
    } catch (e) { console.error('[PlayCounter] increment failed:', e); }
  }

  async function getAll() {
    try {
      const r = await fetch(`${DB}/plays.json`);
      return (await r.json()) || {};
    } catch (e) { return {}; }
  }

  async function submitScore(gameId, name, score, streak) {
    try {
      const r = await fetch(`${DB}/leaderboard/${gameId}.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.slice(0, 10),
          score,
          streak,
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    } catch (e) { console.error('[PlayCounter] submitScore failed:', e); throw e; }
  }

  async function getTopScores(gameId, limit = 10) {
    try {
      const r = await fetch(`${DB}/leaderboard/${gameId}.json`);
      const data = await r.json();
      if (!data || typeof data !== 'object') return [];
      return Object.values(data)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (e) { return []; }
  }

  return { increment, getAll, submitScore, getTopScores };
})();
