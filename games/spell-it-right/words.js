// Each entry: { word, misspellings: [3 variants], difficulty: 1|2|3 }
// The game shuffles [word, ...misspellings] at display time.
const WORDS = [
  // ── Easy ──────────────────────────────────────────────────────────────────
  { word: 'FRIEND',    misspellings: ['FREIND',    'FREND',       'FRIOND'     ], difficulty: 1 },
  { word: 'BECAUSE',   misspellings: ['BECUASE',   'BECAUS',      'BECOUSE'    ], difficulty: 1 },
  { word: 'RECEIVE',   misspellings: ['RECIEVE',   'RECEVE',      'RECEEVE'    ], difficulty: 1 },
  { word: 'BELIEVE',   misspellings: ['BELEIVE',   'BELEAVE',     'BELEVE'     ], difficulty: 1 },
  { word: 'WEIRD',     misspellings: ['WIERD',     'WERD',        'WEERD'      ], difficulty: 1 },
  { word: 'ACHIEVE',   misspellings: ['ACHEIVE',   'ACHIVE',      'ACHEEVE'    ], difficulty: 1 },
  { word: 'BEAUTIFUL', misspellings: ['BEUTIFUL',  'BEAUTIFULL',  'BEAUTFUL'   ], difficulty: 1 },
  { word: 'TOMORROW',  misspellings: ['TOMMOROW',  'TOMOROW',     'TOMMORROW'  ], difficulty: 1 },
  { word: 'GRAMMAR',   misspellings: ['GRAMMER',   'GRAMER',      'GRAMMARR'   ], difficulty: 1 },
  { word: 'HEIGHT',    misspellings: ['HIEGHT',    'HEIGTH',      'HIEHT'      ], difficulty: 1 },
  { word: 'FEBRUARY',  misspellings: ['FEBUARY',   'FEBURARY',    'FEBRURAY'   ], difficulty: 1 },
  { word: 'LIBRARY',   misspellings: ['LIBARY',    'LIBERRY',     'LIBRAY'     ], difficulty: 1 },
  { word: 'WEDNESDAY', misspellings: ['WENSDAY',   'WENDSDAY',    'WEDNSDAY'   ], difficulty: 1 },
  { word: 'SCISSORS',  misspellings: ['SISSORS',   'SCISORS',     'SCISSSORS'  ], difficulty: 1 },
  { word: 'BUSINESS',  misspellings: ['BUISNESS',  'BISNESS',     'BUSINES'    ], difficulty: 1 },
  { word: 'PIECE',     misspellings: ['PEICE',     'PEECE',       'PEIECE'     ], difficulty: 1 },
  { word: 'TWELVE',    misspellings: ['TWELEVE',   'TWELV',       'TWELF'      ], difficulty: 1 },
  { word: 'GUARD',     misspellings: ['GAURD',     'GURARD',      'GURAD'      ], difficulty: 1 },
  { word: 'ISLAND',    misspellings: ['ILSAND',    'ISLAAND',     'ILAND'      ], difficulty: 1 },
  { word: 'FOREIGN',   misspellings: ['FORIEGN',   'FOREIN',      'FOREGN'     ], difficulty: 1 },

  // ── Medium ────────────────────────────────────────────────────────────────
  { word: 'NECESSARY',   misspellings: ['NECESARY',    'NECCESSARY',   'NECISSARY'   ], difficulty: 2 },
  { word: 'SEPARATE',    misspellings: ['SEPERATE',    'SEPARETE',     'SEPARRATE'   ], difficulty: 2 },
  { word: 'DEFINITELY',  misspellings: ['DEFINATELY',  'DEFINITLY',    'DEFINITELLY' ], difficulty: 2 },
  { word: 'OCCURRENCE',  misspellings: ['OCCURANCE',   'OCCURENCE',    'OCCURRANCE'  ], difficulty: 2 },
  { word: 'EMBARRASS',   misspellings: ['EMBARASS',    'EMBARRAS',     'EMBARRISS'   ], difficulty: 2 },
  { word: 'RECOMMEND',   misspellings: ['RECOMEND',    'RECCOMMEND',   'RECOMMMEND'  ], difficulty: 2 },
  { word: 'DISAPPEAR',   misspellings: ['DISSAPEAR',   'DISAPEAR',     'DISAPEARE'   ], difficulty: 2 },
  { word: 'RHYTHM',      misspellings: ['RYTHEM',      'RYTHM',        'RYTHYM'      ], difficulty: 2 },
  { word: 'CONSCIENCE',  misspellings: ['CONSCIENSE',  'CONSIENCE',    'CONCIENCE'   ], difficulty: 2 },
  { word: 'PRIVILEGE',   misspellings: ['PRIVILAGE',   'PRIVELEGE',    'PRIVELIDGE'  ], difficulty: 2 },
  { word: 'VACUUM',      misspellings: ['VACCUM',      'VACCUUM',      'VACUMM'      ], difficulty: 2 },
  { word: 'RELEVANT',    misspellings: ['RELEVENT',    'RELAVENT',     'REVELANT'    ], difficulty: 2 },
  { word: 'IMMEDIATELY', misspellings: ['IMEDIATELY',  'IMMEDIATLY',   'IMMEDATLY'   ], difficulty: 2 },
  { word: 'INDEPENDENT', misspellings: ['INDEPENDANT', 'INDPENDENT',   'INDEPENDINT' ], difficulty: 2 },
  { word: 'CEMETERY',    misspellings: ['CEMETARY',    'CEMETERRY',    'CEMENTRY'    ], difficulty: 2 },
  { word: 'CATEGORY',    misspellings: ['CATAGORY',    'CATERGORY',    'CATAGORRY'   ], difficulty: 2 },
  { word: 'CALENDAR',    misspellings: ['CALENDER',    'CALANDER',     'CALLENDER'   ], difficulty: 2 },
  { word: 'COMMITTEE',   misspellings: ['COMMITEE',    'COMMITTE',     'COMMITTTEE'  ], difficulty: 2 },
  { word: 'NEIGHBOR',    misspellings: ['NIEGHBOR',    'NEIBHBOR',     'NEIGHBOOR'   ], difficulty: 2 },
  { word: 'NOTICEABLE',  misspellings: ['NOTICABLE',   'NOTICIBLE',    'NOTCEABLE'   ], difficulty: 2 },

  // ── Hard ──────────────────────────────────────────────────────────────────
  { word: 'ACCOMMODATE',   misspellings: ['ACCOMODATE',    'ACOMMODATE',     'ACCOMMADATE'    ], difficulty: 3 },
  { word: 'MILLENNIUM',    misspellings: ['MILLENIUM',     'MILLENNIEM',     'MILENNIUM'      ], difficulty: 3 },
  { word: 'QUESTIONNAIRE', misspellings: ['QUESTIONAIRE',  'QUESTIONNARE',   'QUESTIONAIRRE'  ], difficulty: 3 },
  { word: 'CONSCIENTIOUS', misspellings: ['CONSCIENCIOUS', 'CONCIENTIOUS',   'CONSCENTIOUS'   ], difficulty: 3 },
  { word: 'DESICCATE',     misspellings: ['DESSICATE',     'DESICATE',       'DESSICATTE'     ], difficulty: 3 },
  { word: 'EXAGGERATE',    misspellings: ['EXAGERATE',     'EXXAGERATE',     'EXAGGERRATE'    ], difficulty: 3 },
  { word: 'SUPERSEDE',     misspellings: ['SUPERCEDE',     'SUPERCEED',      'SUPERSEED'      ], difficulty: 3 },
  { word: 'PERSEVERANCE',  misspellings: ['PERSEVERENCE',  'PERSERVERANCE',  'PERSEVERANSE'   ], difficulty: 3 },
  { word: 'FLUORESCENT',   misspellings: ['FLOURESCENT',   'FLUORECENT',     'FLOURECENT'     ], difficulty: 3 },
  { word: 'BUREAUCRACY',   misspellings: ['BUREACRACY',    'BURAECRACY',     'BUROCRACY'      ], difficulty: 3 },
  { word: 'PARLIAMENT',    misspellings: ['PARLIMENT',     'PARLEMENT',      'PARLIAMANT'     ], difficulty: 3 },
  { word: 'PRONUNCIATION', misspellings: ['PRONOUNCIATION','PRONUNCATION',   'PRONONCIATION'  ], difficulty: 3 },
  { word: 'MISSPELL',      misspellings: ['MISPELL',       'MISSPEL',        'MISPEL'         ], difficulty: 3 },
  { word: 'THRESHOLD',     misspellings: ['THRESHHOLD',    'TRESHHOLD',      'TREESHOLD'      ], difficulty: 3 },
  { word: 'WITHHOLD',      misspellings: ['WITHOLD',       'WITHELD',        'WITHEHOLED'     ], difficulty: 3 },
  { word: 'PUBLICLY',      misspellings: ['PUBLICALY',     'PUBLICALLY',     'PUBICLY'        ], difficulty: 3 },
  { word: 'PLAYWRIGHT',    misspellings: ['PLAYWRITE',     'PLAYWRYTE',      'PLAYWRYGHT'     ], difficulty: 3 },
  { word: 'MEMENTO',       misspellings: ['MOMENTO',       'MEMMENTO',       'MEMEMTO'        ], difficulty: 3 },
  { word: 'MANEUVER',      misspellings: ['MANUEVER',      'MANOUVRE',       'MANOEUVER'      ], difficulty: 3 },
  { word: 'LEISURE',       misspellings: ['LIESURE',       'LEASURE',        'LEIZURE'        ], difficulty: 3 },
];

function getWords() {
  const a = [...WORDS];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
