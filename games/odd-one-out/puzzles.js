const PUZZLES = [
  // Easy (difficulty: 1)
  { numbers: [2, 4, 7, 8],       oddIndex: 2, property: 'Others are even',             difficulty: 1 },
  { numbers: [3, 6, 9, 14],      oddIndex: 3, property: 'Others are multiples of 3',   difficulty: 1 },
  { numbers: [15, 25, 35, 42],   oddIndex: 3, property: 'Others are multiples of 5',   difficulty: 1 },
  { numbers: [5, 10, 15, 22],    oddIndex: 3, property: 'Others are multiples of 5',   difficulty: 1 },
  { numbers: [1, 3, 5, 8],       oddIndex: 3, property: 'Others are odd',              difficulty: 1 },
  { numbers: [4, 8, 12, 9],      oddIndex: 3, property: 'Others are multiples of 4',  difficulty: 1 },
  { numbers: [10, 20, 30, 35],   oddIndex: 3, property: 'Others are multiples of 10', difficulty: 1 },
  { numbers: [2, 6, 10, 9],      oddIndex: 3, property: 'Others are even',             difficulty: 1 },
  { numbers: [7, 14, 21, 25],    oddIndex: 3, property: 'Others are multiples of 7',  difficulty: 1 },
  { numbers: [1, 4, 9, 10],      oddIndex: 3, property: 'Others are perfect squares', difficulty: 1 },
  { numbers: [6, 12, 18, 25],    oddIndex: 3, property: 'Others are multiples of 6',  difficulty: 1 },
  { numbers: [11, 22, 33, 40],   oddIndex: 3, property: 'Others are multiples of 11', difficulty: 1 },

  // Medium (difficulty: 2)
  { numbers: [4, 9, 16, 18],     oddIndex: 3, property: 'Others are perfect squares', difficulty: 2 },
  { numbers: [2, 3, 5, 9],       oddIndex: 3, property: 'Others are prime',           difficulty: 2 },
  { numbers: [2, 3, 5, 4],       oddIndex: 3, property: 'Others are prime',           difficulty: 2 },
  { numbers: [1, 8, 27, 16],     oddIndex: 3, property: 'Others are perfect cubes',   difficulty: 2 },
  { numbers: [3, 11, 17, 21],    oddIndex: 3, property: 'Others are prime',           difficulty: 2 },
  { numbers: [25, 36, 49, 54],   oddIndex: 3, property: 'Others are perfect squares', difficulty: 2 },
  { numbers: [6, 10, 15, 11],    oddIndex: 3, property: 'Others are composite (non-prime > 1)', difficulty: 2 },
  { numbers: [12, 18, 24, 17],   oddIndex: 3, property: 'Others are multiples of 6', difficulty: 2 },
  { numbers: [100, 64, 49, 42],  oddIndex: 3, property: 'Others are perfect squares', difficulty: 2 },
  { numbers: [13, 17, 23, 27],   oddIndex: 3, property: 'Others are prime',           difficulty: 2 },
  { numbers: [2, 4, 8, 12],      oddIndex: 3, property: 'Others are powers of 2',    difficulty: 2 },
  { numbers: [1, 2, 6, 24],      oddIndex: 2, property: 'Others are factorials (1!, 2!, 4!)', difficulty: 2 },

  // Hard (difficulty: 3)
  { numbers: [1, 8, 27, 48],     oddIndex: 3, property: 'Others are perfect cubes',   difficulty: 3 },
  { numbers: [6, 28, 42, 496],   oddIndex: 2, property: 'Others are perfect numbers', difficulty: 3 },
  { numbers: [1, 3, 6, 11],      oddIndex: 3, property: 'Others are triangular numbers', difficulty: 3 },
  { numbers: [1, 1, 2, 4],       oddIndex: 3, property: 'Others are Fibonacci numbers', difficulty: 3 },
  { numbers: [31, 37, 41, 45],   oddIndex: 3, property: 'Others are prime',           difficulty: 3 },
  { numbers: [4, 16, 64, 48],    oddIndex: 3, property: 'Others are powers of 4',    difficulty: 3 },
  { numbers: [2, 3, 5, 6],       oddIndex: 3, property: 'Others are prime',           difficulty: 3 },
  { numbers: [1, 4, 9, 7],       oddIndex: 3, property: 'Others are perfect squares', difficulty: 3 },
  { numbers: [0, 1, 1, 3],       oddIndex: 3, property: 'Others are Fibonacci numbers', difficulty: 3 },
  { numbers: [120, 24, 6, 10],   oddIndex: 3, property: 'Others are factorials',     difficulty: 3 },
  { numbers: [3, 5, 7, 9],       oddIndex: 3, property: 'Others are prime (9 = 3×3)', difficulty: 3 },
  { numbers: [10, 15, 21, 25],   oddIndex: 3, property: 'Others are triangular numbers', difficulty: 3 },
];

function getPuzzles() {
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  const easy   = shuffle(PUZZLES.filter(p => p.difficulty === 1));
  const medium = shuffle(PUZZLES.filter(p => p.difficulty === 2));
  const hard   = shuffle(PUZZLES.filter(p => p.difficulty === 3));
  return [...easy, ...medium, ...hard];
}
