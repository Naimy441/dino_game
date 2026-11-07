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
// Birds seen head-on (the across-the-track half of the 3D model).
export const BIRD_FRONT_UP = [
  'b........b',
  'bb......bb',
  '.bbbyybbb.',
  '....yy....',
  '....yy....',
];
export const BIRD_FRONT_DOWN = [
  '....yy....',
  '....yy....',
  '.bbbyybbb.',
  'bb......bb',
  'b........b',
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

// ---------------------------------------------------------------- head-on views
// Used in the chase and first-person cameras so things that come at you are
// seen from the front, not edge-on.
export const NEON_CAR_BACK = [
  '.ppppp.',
  'pcccccp',
  'ppppppp',
  'ypppppy',
  'kk...kk',
];
export const SHARK_FRONT = [
  '...g...',
  '..ggg..',
  '.ggggg.',
  'gkgggkg',
  'gwwwwwg',
  '.wwwww.',
];
export const MINECART_FRONT = [
  'bbbbbbb',
  'bgggggb',
  'bbbbbbb',
  '.k...k.',
];
export const CART_FRONT = [
  'kkkkkkk',
  'k.k.k.k',
  'kkkkkkk',
  '.k.k.k.',
  '.kkkkk.',
  '.k...k.',
  '.d...d.',
];
export const PLANE_FRONT = [
  '......r......',
  'bbbbbbrbbbbbb',
  '.....rwr.....',
  '......r......',
];

// ---------------------------------------------------------------- shadow city
export const GOON = [
  '...hhhh...',
  '...hhhh...',
  '.hhhhhhhh.',
  '...dddd...',
  '...edde...',
  '...dddd...',
  '..kkkkkk..',
  '.kkkdkkkk.',
  'kkkkdkkkkk',
  'kk.kdkk.kk',
  'kk.kdkk.kk',
  'kk.kkkk.kk',
  'dd.kkkk.dd',
  '...kkkk...',
  '...kkkk...',
  '...k..k...',
  '...k..k...',
  '...k..k...',
  '..hh..hh..',
];
export const BRUISER = [
  '...hhhh...',
  '...hhhh...',
  '.hhhhhhhh.',
  '...dddd...',
  '...edde...',
  '...dddd...',
  '.kkkkkkkk.',
  'kkkkggkkkk',
  'kkkkkgkkkk',
  'kkkkkkkkkk',
  'kk.kkkk.kk',
  'kk.kkkk.kk',
  'kk.kkkk.kk',
  'dd.kkkk.dd',
  'dd.kkkk.dd',
  '...kkkk...',
  '...kkkk...',
  '...k..k...',
  '...k..k...',
  '...k..k...',
  '..hh..hh..',
  '..hh..hh..',
];
export const HYDRANT = ['..gg..', '.rrrr.', '.rrrr.', 'rrrrrr', '.rrrr.', '.rrrr.', '.rrrr.', 'rrrrrr'];
export const TRASH_CAN = [
  '...dd...',
  '.mmmmmm.',
  'mmmmmmmm',
  '.mdmdmd.',
  '.mdmdmd.',
  '.mdmdmd.',
  '.mdmdmd.',
  '.mdmdmd.',
  '.mdmdmd.',
  '.mmmmmm.',
];
export const HANG_SIGN = [
  '.c.......c.',
  '.c.......c.',
  'bbbbbbbbbbb',
  'bgbgbgggbgb',
  'bgbgbgbbbgb',
  'bgggbgggbgb',
  'bgbgbgbbbbb',
  'bgbgbgggbgb',
  'bbbbbbbbbbb',
];
export const STREET_LAMP = [
  'ggggg',
  '.lll.',
  '..p..',
  '..p..',
  '..p..',
  '..p..',
  '..p..',
  '..p..',
  '..p..',
  '..p..',
  '..p..',
  '.ppp.',
];

// ---------------------------------------------------------------- planet zorb
export const POD = ['..pppp..', '.ppgppp.', 'pppppppp', 'ppppppgp', 'pgpppppp', 'pppppppp', '.pppppp.', '..pppp..'];
export const TENTACLE = [
  '..tt..',
  '.ttt..',
  '.tt...',
  'ttt...',
  'tts...',
  '.ttt..',
  '..ttt.',
  '..stt.',
  '...ttt',
  '..tts.',
  '..ttt.',
  '.ttt..',
  '.stt..',
  '.tttt.',
  '..ttt.',
  '..stt.',
  '.tttt.',
  '.ttts.',
  'tttttt',
  'tttttt',
];
export const BLOB = ['...bbbb...', '..bbbbbb..', '.bwkbbwkb.', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbbbbbbbbb', '.b.bb.bb.b'];
export const EYE_DRONE = [
  '...mmm...',
  '.mmmmmmm.',
  'mmwwwwwmm',
  'mwwiiiwwm',
  'mwwikiwwm',
  'mwwiiiwwm',
  'mmwwwwwmm',
  '.mmmmmmm.',
];
export const ALIEN_PLANT = [
  '.g...g.',
  'ggg.ggg',
  '.g...g.',
  '.s...s.',
  '..s.s..',
  '...s...',
  '...s...',
  '..sss..',
];
export const EYE_STALK = ['.www.', 'wwkww', '.www.', '..s..', '..s..', '.s...', '.s...', '..s..', '..s..', '.sss.'];
export const ALIEN_SPIRE = ['..p..', '..p..', '.ppp.', '.pgp.', '.ppp.', 'ppppp', 'ppgpp', 'ppppp', 'ppppp'];

// ---------------------------------------------------------------- haunted hollow
export const TOMBSTONE = [
  '..ssss..',
  '.ssssss.',
  'ssssssss',
  'sssdssss',
  'ssdddsss',
  'sssdssss',
  'sssdssss',
  'ssssssss',
  'ssssssss',
  'msssssms',
  'mmmmmmmm',
];
export const PUMPKIN = ['...gg...', '.oooooo.', 'oyooooyo', 'oyyooyyo', 'oooooooo', 'oyyyyyyo', '.oyoyoo.'];
export const HAND = [
  'h.h.h..',
  'h.h.h..',
  'hhhhh.h',
  'hhhhhhh',
  '.hhhhh.',
  '..hhh..',
  '..hhh..',
  '..hhh..',
  '..hhh..',
  '.ddddd.',
  'ddddddd',
];
export const GHOST = [
  '...wwww...',
  '..wwwwww..',
  '.wwwwwwww.',
  '.wkkwwkkw.',
  '.wkkwwkkw.',
  'wwwwwwwwww',
  'wwwwkkwwww',
  'wwwwkkwwww',
  'wwwwwwwwww',
  'wwwwwwwwww',
  'wwwwwwwwww',
  'wwwwwwwwww',
  'w.ww.ww.ww',
  '..w...w..w',
];
export const FENCE = ['b..b..b..b', 'bbbbbbbbbb', 'b..b..b..b', 'b..b..b..b', 'bbbbbbbbbb', 'b..b..b..b'];
export const MANSION = [
  '.....b..........b.....',
  '....bbb........bbb....',
  '....bbb..bbbb..bbb....',
  '...bbbbbbbbbbbbbbbb...',
  '...bybbybbbbbbybbyb...',
  '...bbbbbbbbbbbbbbbb...',
  '.bbbbbbbbbbbbbbbbbbbb.',
  '.bybbybbybbbbybbybbyb.',
  '.bbbbbbbbbbbbbbbbbbbb.',
  'bbbbbbbbbbbyybbbbbbbbb',
  'bybbybbbbbbyybbbbybbyb',
  'bbbbbbbbbbbyybbbbbbbbb',
];
export const MOON_FACE = [
  '...wwww...',
  '.wwwwwwww.',
  '.wwwwwgww.',
  'wwgwwwwwww',
  'wwwwwwwwww',
  'wwwwwwgwww',
  'wwwgwwwwww',
  '.wwwwwwww.',
  '.wwwwwgww.',
  '...wwww...',
];

// ---------------------------------------------------------------- sky kingdom
export const COLUMN = [
  'mmmmmmmm',
  '.dddddd.',
  '.mdmdmd.',
  '.mdmdmd.',
  '.mdmdmd.',
  '.mdmdmd.',
  '.mdmdmd.',
  '.mdmdmd.',
  '.mdmdmd.',
  '.mdmdmd.',
  '.mdmdmd.',
  '.dddddd.',
  'mmmmmmmm',
];
export const BALLOON = ['..rrr..', '.rrrrr.', 'rrwrrrr', 'rwrrrrr', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...', '...g...', '...g...'];
export const ISLAND = [
  '..gggggggggg..',
  '.gggggggggggg.',
  'dddddddddddddd',
  '.dddddddddddd.',
  '..dddddddddd..',
  '...dddddddd...',
  '....dddddd....',
  '.....dddd.....',
  '......dd......',
];

// ---------------------------------------------------------------- bamboo dojo
export const BAMBOO_SPIKES = ['.t..t..t.', '.g..g.tg.', '.l.tg.gl.', '.g.gl.gg.', 'tglgg.ggt', 'gggggtggg', 'ggggggggg'];
export const STONE_LANTERN = [
  '...s...',
  '.sssss.',
  'sssssss',
  '.ddddd.',
  '.dyyyd.',
  '.dyyyd.',
  '.ddddd.',
  'sssssss',
  '..sss..',
  '..sss..',
  '..sss..',
  '..sss..',
  '.sssss.',
  'sssssss',
];
export const SHURIKEN = ['...m...', '...m...', '..mdm..', 'mmdddmm', '..mdm..', '...m...', '...m...'];
export const BAMBOO = ['l', 'g', 'g', 'g', 'k', 'g', 'g', 'g', 'k', 'g', 'g', 'g', 'k', 'g', 'g', 'g', 'k', 'g', 'g', 'g'];
export const CHERRY = [
  '..pppp....',
  '.pppwppp..',
  'pppppppppp',
  'ppwppppwpp',
  '.pppppppp.',
  '..pp.bpp..',
  '.....b....',
  '....b.....',
  '....b.....',
  '...bb.....',
];
export const TORII = [
  'rrrrrrrrrrrrr',
  '.rrrrrrrrrrr.',
  '...r.....r...',
  '.rrrrrrrrrrr.',
  '...r.....r...',
  '...r.....r...',
  '...r.....r...',
  '...r.....r...',
  '...r.....r...',
  '..kk.....kk..',
];

// ---------------------------------------------------------------- toy box
export const SOLDIER = [
  '.kkkk.',
  '.kkkk.',
  '.kkkk.',
  '.ssss.',
  '.ssss.',
  'rrrrrr',
  'rryyrr',
  'r.rr.r',
  'r.yr.r',
  'r.rr.r',
  '..bb..',
  '.b..b.',
  '.b..b.',
  '.b..b.',
  'kk..kk',
];
export const MARBLE = ['.ccc.', 'cwccc', 'ccccd', 'cccdd', '.cdd.'];
export const TOY_PLANE = ['...........r.', '..........rr.', '.rrrrrrrrrrr.', 'brrwwrrrrrrrr', '.rrrrrrrrrrr.', '....bbbbb....'];
export const CRAYON = ['.c.', 'ccc', 'ccc', 'www', 'ccc', 'ccc', 'ccc', 'ccc', 'www', 'ccc'];

// ---------------------------------------------------------------- gear
export const GUN = ['kkkkkkkkg', 'kkkkkkkkk', 'kgk......', 'kk.......', 'kk.......'];
export const KATANA = ['s', 's', 's', 's', 's', 's', 's', 's', 's', 'g', 'h', 'h', 'h'];

// ---------------------------------------------------------------- splash lagoon
export const FIN = [
  '.....g..',
  '....gg..',
  '...ggg..',
  '..gggg..',
  '.ggggg..',
  'gggggggg',
  '.bbbbbbb',
  '..bbbbb.',
  '...bbb..',
];
export const PALM = [
  'gg..g..gg',
  '.ggggggg.',
  'gg.gtg.gg',
  '....t....',
  '....t....',
  '...t.....',
  '...t.....',
  '...t.....',
  '..ttt....',
];
export const SAILBOAT = ['...w....', '...ww...', '...www..', '...wwww.', '...m....', 'bbbbbbbb', '.bbbbbb.'];
