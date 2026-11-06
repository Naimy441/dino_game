// Pixel art for every model in the game, drawn for Dino Dash. Row 0 is the
// top. '.' is empty; every other character is looked up in a palette, so the
// same drawing can be recoloured per world (and rendered in grey for the
// classic desert).

// ---------------------------------------------------------------- the dino
export const DINO_BODY = [
  '...........#########..',
  '..........###e#######.',
  '..........###########.',
  '..........###########.',
  '..........######......',
  '..........#########...',
  '#........######.......',
  '#.......#######.......',
  '##.....#########......',
  '###...##########aa....',
  '###############..a....',
  '.#############........',
  '..###########.........',
  '...#########..........',
  '....#######...........',
];
// The head alone (first-person view hides it so it never fills the lens).
export const DINO_HEAD_ROWS = 6;

export const DINO_DUCK = [
  '...................########.',
  '#.......#########.###e######',
  '##....######################',
  '########################....',
  '.#####################......',
  '..#################aa.......',
  '...#############.....a......',
];

export const DINO_LEG = [
  '##.',
  '##.',
  '#..',
  '###',
];

// ---------------------------------------------------------------- desert
export const CACTUS_TALL = [
  '....##....',
  '...####...',
  '...####...',
  '...####.#.',
  '.#.####.##',
  '##.####.##',
  '##.####.##',
  '##.####.##',
  '##.######.',
  '.######...',
  '...####...',
  '...####...',
  '...####...',
  '...####...',
  '...####...',
  '...####...',
];
export const CACTUS_SMALL = [
  '..##...',
  '.####..',
  '.####.#',
  '#####.#',
  '#.#####',
  '#.####.',
  '######.',
  '.####..',
  '.####..',
  '.####..',
];
export const BAT_UP = [
  '#..............#',
  '##............##',
  '###...#..#...###',
  '.###..####..###.',
  '..############..',
  '...##########...',
  '......####......',
  '.......##.......',
];
export const BAT_DOWN = [
  '......#..#......',
  '......####......',
  '....########....',
  '..############..',
  '.###..####..###.',
  '###....##....###',
  '##............##',
  '#..............#',
];
export const CLOUD = [
  '.......######.......',
  '.....###....##......',
  '...###........##....',
  '.##............####.',
  '##................##',
  '####################',
];
export const DUNE = [
  '..........######..........',
  '......####......####......',
  '...###..............###...',
  '.##....................##.',
  '#........................#',
];
export const PEBBLE = ['.##.', '####'];

// ---------------------------------------------------------------- forest
export const PINE = [
  '....g....',
  '...ggg...',
  '..ggggg..',
  '...ggg...',
  '..ggggg..',
  '.ggggggg.',
  '..ggggg..',
  '.ggggggg.',
  'ggggggggg',
  '....t....',
  '....t....',
];
export const BUSH = ['..gggg..', '.gggggg.', 'gggggggg', 'gggggggg'];
export const STUMP = ['.rrrr.', 'tttttt', 'tttttt', 'tttttt', 'tttttt', 'tt..tt'];
export const LOG_STACK = [
  '..rr..',
  '.rttr.',
  '.rttr.',
  'rrrrrr',
  'rttrtt',
  'rttrtt',
  'rrrrrr',
  'rttrtt',
  'rttrtt',
  'rrrrrr',
];
export const MUSHROOM = ['.rrrr.', 'rwrrwr', 'rrrrrr', '..ww..', '..ww..'];
export const BIRD_UP = [
  '..yy....',
  '.yyyy...',
  'bbyyyyyy',
  '..bbbb..',
  '...bb...',
];
export const BIRD_DOWN = [
  '...bb...',
  '..bbbb..',
  'bbyyyyyy',
  '.yyyy...',
  '..yy....',
];
export const FLOWER = ['.p.', 'pyp', '.p.', '.g.', '.g.'];

// ---------------------------------------------------------------- volcano
export const VOLCANO = [
  '..........ll..........',
  '.........lrrl.........',
  '........rrrrrr........',
  '.......rrrrrrrr.......',
  '......rrrrlrrrrr......',
  '.....rrrrrlrrrrrr.....',
  '....rrrrrrrlrrrrrr....',
  '...rrrrrrrrrlrrrrrr...',
  '..rrrrrrrrrrlrrrrrrr..',
  '.rrrrrrrrrrrrrrrrrrrr.',
  'rrrrrrrrrrrrrrrrrrrrrr',
];
export const LAVA_ROCK = [
  '..rrr...',
  '.rrlrr..',
  'rrrlrrr.',
  'rlrrrlrr',
  'rrrrrrrr',
];
export const OBSIDIAN = [
  '..o..',
  '..o..',
  '.ooo.',
  '.ooo.',
  '.olo.',
  'ooooo',
  'oolooo',
];
export const DEAD_TREE = [
  'b...b.',
  '.b.b..',
  '..b..b',
  '..b.b.',
  '..bb..',
  '..b...',
  '..b...',
];

// ---------------------------------------------------------------- moon
export const MOON_ROCK = [
  '...gggg...',
  '.ggggwggg.',
  'gggwggggdg',
  'ggggggdggg',
  'gdgggggggg',
];
export const MOON_SPIRE = [
  '..g..',
  '.ggg.',
  '.gwg.',
  '.ggg.',
  'ggggg',
  'gwggg',
  'ggggg',
  'ggggd',
];
export const UFO = [
  '....cccc....',
  '...cccccc...',
  '.gggggggggg.',
  'gyggyggyggyg',
  '.gggggggggg.',
  '...y....y...',
];
export const FLAG = ['wrrrr', 'wbbrr', 'wrrrr', 'w....', 'w....', 'w....', 'w....'];
export const EARTH = [
  '...bbbb...',
  '.bbggbbbb.',
  'bbgggbbwbb',
  'bggbbbbbbb',
  'bbgbbbgggb',
  'bbbbbggggb',
  '.bwbbbggb.',
  '...bbbb...',
];

// ---------------------------------------------------------------- block world
export const ZOMBIE = [
  '.gggg.',
  '.gggg.',
  '.kgkg.',
  '.gggg.',
  'cccccg',
  'gccccg',
  'gcccc.',
  '.cccc.',
  '.bbbb.',
  '.bbbb.',
  '.b..b.',
  '.b..b.',
];
export const PICKAXE = [
  '.ddddd.',
  'dd.w.dd',
  'd..w..d',
  '...w...',
  '...w...',
  '...w...',
];

// ---------------------------------------------------------------- reef
export const CORAL = [
  '.p...p.',
  '.p.p.p.',
  'pp.p.pp',
  '.p.ppp.',
  '.ppp.p.',
  '..ppp..',
  '...p...',
  '..ppp..',
];
export const CORAL_TALL = [
  'o...o',
  'o.o.o',
  'ooooo',
  '..o..',
  'o.o..',
  'ooo.o',
  '..ooo',
  '..o..',
  '..o..',
  '.ooo.',
];
export const JELLY = [
  '.pppp.',
  'pwpppp',
  'pppppp',
  'p.p.p.',
  'p.p.p.',
  '.p.p.p',
  '.p...p',
];
export const SHARK = [
  '......g.......',
  '.....gg.......',
  'g...gggggggg..',
  'gg.gggggggkggg',
  'gggggwwwwwwgg.',
  'g...gg.wwwww..',
];
export const FISH = ['..yy.', 'yyyky', 'yyyyy', '..yy.'];
export const KELP = ['g.', 'gg', '.g', 'gg', 'g.', 'gg', '.g', 'gg', 'g.', 'g.'];

// ---------------------------------------------------------------- cave
export const STALAGMITE = [
  '..s..',
  '..s..',
  '.sss.',
  '.sds.',
  '.sss.',
  'sssds',
  'sssss',
];
export const STALACTITE = [
  'sssss',
  'sdsss',
  '.sss.',
  '.sds.',
  '.sss.',
  '..s..',
  '..s..',
];
export const CRYSTAL = [
  '..c...',
  '.cwc.c',
  '.ccc.c',
  'c.cc.c',
  'cc.ccc',
  '.cccc.',
];
export const MINECART = [
  'bbbbbbbb',
  'bggggggb',
  'bbbbbbbb',
  '.k....k.',
];

// ---------------------------------------------------------------- store
export const CANS = [
  '...rr...',
  '...ww...',
  '..rrrr..',
  '..wwww..',
  '.rrrrrr.',
  '.wwwwww.',
  'rrrrrrrr',
  'wwwwwwww',
];
export const WET_SIGN = [
  '..yy..',
  '..yy..',
  '.ykky.',
  '.yyyy.',
  'yykkyy',
  'yyyyyy',
  'y....y',
];
export const CART = [
  'kkkkkkkkkk.k',
  'k.k.k.k.k.k.',
  'kkkkkkkkkk..',
  '.k.k.k.k.k..',
  '..kkkkkkk...',
  '..k.....k...',
  '..d.....d...',
];
export const SALE_SIGN = [
  '....k....',
  '....k....',
  'rrrrrrrrr',
  'rwwrwrwwr',
  'rwrrwrwrr',
  'rrwrwrwwr',
  'rwwrwrwwr',
  'rrrrrrrrr',
];

// ---------------------------------------------------------------- candy
export const LOLLIPOP = [
  '.pppp.',
  'pwwwpp',
  'pwppwp',
  'ppwwpp',
  '.pppp.',
  '..w...',
  '..w...',
  '..w...',
];
export const GUMDROP = ['..gg..', '.gggg.', 'gwgggg', 'gggggg', 'gggggg'];
export const CUPCAKE = [
  '..r...',
  '.wwww.',
  'wwpwww',
  'wwwwpw',
  'bbbbbb',
  '.bbbb.',
  '.bbbb.',
];
export const CANDY = ['p.ww.p', 'ppwwpp', 'p.ww.p'];
export const CANE = ['.rwr', 'w..w', 'r..r', '...w', '...r', '...w', '...r', '...w'];
export const BEE = ['..ww..', '.wwww.', 'ykykyk', 'ykykyk', '.ykyk.'];

// ---------------------------------------------------------------- tundra
export const SNOWMAN = [
  '..kk..',
  '.kkkk.',
  '.wwww.',
  '.wkwk.',
  '.wwoo.',
  '.wwww.',
  'rrrrrr',
  'wwkwww',
  'wwwwww',
  'wwkwww',
  '.wwww.',
];
export const ICE_SPIKE = ['..c..', '.cwc.', '.ccc.', 'cccwc', 'cwccc'];
export const PENGUIN = [
  '.kkk.',
  'kwkwk',
  'kwwok',
  'kwwwk',
  'kwwwk',
  'kwwwk',
  '.o.o.',
];
export const SNOW_PINE = [
  '....w....',
  '...wgw...',
  '..gwwwg..',
  '...gwg...',
  '..wgwgw..',
  '.ggwwwgg.',
  '..ggwgg..',
  '.wgwgwgw.',
  'gwgggggwg',
  '....t....',
];
export const IGLOO = ['...wwww...', '.wwwwwwww.', 'wwwkwwwwww', 'wwkkkwwwww', 'wwkkkwwwww'];

// ---------------------------------------------------------------- neon
export const NEON_PALM = [
  'pp.p.pp',
  '.ppppp.',
  'p..c..p',
  '...c...',
  '...c...',
  '...c...',
  '...c...',
  '...c...',
];
export const NEON_CAR = [
  '...pppppp...',
  '..p.c..c.p..',
  'pppppppppppp',
  'yppppppppppy',
  '.kk......kk.',
];
export const BARRIER = ['yk' + 'yk' + 'yk' + 'yk', 'kykykyky', '.c....c.', '.c....c.'];
export const DRONE = ['cc....cc', '.ckkkkc.', '..kppk..', '...kk...'];

// ---------------------------------------------------------------- space
export const ASTEROID = [
  '..gggg..',
  '.gggdgg.',
  'ggdggggg',
  'gggggdgg',
  'gdgggggg',
  '.ggggdg.',
  '..gggg..',
];
export const PLANET = [
  '.....pppp.....',
  '...pppwpppp...',
  'yy.pppppppp.yy',
  '..yyyyyyyyyy..',
  '...pppppwpp...',
  '.....pppp.....',
];
export const SATELLITE = ['bb.w.bb', 'bbwwwbb', 'bb.w.bb'];
export const STAR = ['.w.', 'www', '.w.'];
export const SUN = [
  '..yyyy..',
  '.yyyyyy.',
  'yyyyyyyy',
  'yyyyyyyy',
  'yyyyyyyy',
  'yyyyyyyy',
  '.yyyyyy.',
  '..yyyy..',
];
