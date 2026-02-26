export const HeroPalettes = {
    Warrior: {
        '.': null,
        'R': '#c0392b', // Red Helm
        'A': '#7f8c8d', // Armor
        'S': '#f1c40f', // Skin
        'B': '#2c3e50', // Belt/Boots
        'W': '#ecf0f1', // Sword Blade
        'G': '#f39c12', // Gold Trim
    },
    Mage: {
        '.': null,
        'H': '#8e44ad', // Hat
        'R': '#2980b9', // Robe
        'S': '#f1c40f', // Skin
        'W': '#ecf0f1', // Staff
        'O': '#e67e22', // Orb
    },
    Archer: {
        '.': null,
        'H': '#1e8449', // Hood
        'T': '#27ae60', // Tunic
        'S': '#f1c40f', // Skin
        'B': '#d35400', // Bow
        'L': '#8d6e63', // Leather
    },
    Cleric: {
        '.': null,
        'R': '#f39c12', // Robe
        'W': '#ecf0f1', // White trim
        'S': '#f1c40f', // Skin
        'H': '#f1c40f', // Halo/Hair
        'G': '#f1c40f', // Gold
    },
    Rogue: {
        '.': null,
        'H': '#2c3e50', // Hood (Dark)
        'A': '#8e44ad', // Armor (Purple)
        'S': '#f1c40f', // Skin
        'D': '#bdc3c7', // Dagger
    },
    Paladin: {
        '.': null,
        'H': '#95a5a6', // Helm
        'A': '#bdc3c7', // Armor (Light)
        'G': '#f1c40f', // Gold Trim
        'S': '#34495e', // Shield
    }
};

export const HeroSprites = {
    Warrior: [
        '......RRRR..........',
        '.....RRRRRR.........',
        '.....RRRRRR.........',
        '......SSSS..........',
        '......SSSS..........',
        '....AAAAAAAA........',
        '...AAAAAAAAAA.......',
        '...AAGAAAAAAA.......',
        '...AAGAAAAAAA.......',
        '...AAAAAAAAAA.......',
        '....BBB..BBB........',
        '....BBB..BBB........',
        '....BB....BB........',
        'W...................',
        'WW..................',
        'W...................',
    ],
    Mage: [
        '.......HH...........',
        '......HHHH..........',
        '.....HHHHHH.........',
        '......SSSS..........',
        '......SSSS..........',
        '....RRRRRRRR........',
        '...RRRRRRRRRR.......',
        '...RRRRRRRRRR.......',
        '...RRRRRRRRRR.......',
        '....RR....RR........',
        '....RR....RR........',
        '..........W.........',
        '..........W.........',
        '..........W.........',
        '.........OOO........',
        '.........OOO........',
    ],
    Archer: [
        '......HHH...........',
        '.....HHHHH..........',
        '......SSSS..........',
        '......SSSS..........',
        '....TTTTTTTT........',
        '...TTTTTTTTTT.......',
        '...TTTTTTTTTT.......',
        '...TTTTTTTTTT.......',
        '....LL....LL........',
        '....LL....LL........',
        '....LL....LL........',
        'B...................',
        'BB..................',
        'B.B.................',
        'B...................',
        '....................',
    ],
    Cleric: [
        '......GGGGG.........',
        '......HHHH..........',
        '.....HHHHHH.........',
        '......SSSS..........',
        '......SSSS..........',
        '....WWWWWWWW........',
        '...RRRRRRRRRR.......',
        '...RRRRRRRRRR.......',
        '...RRRRRRRRRR.......',
        '...RRRRRRRRRR.......',
        '....RR....RR........',
        '....RR....RR........',
        '....................',
        'G......G............',
        'G......G............',
        '....................',
    ],
    Rogue: [
        '......HHH...........',
        '.....HHHHH..........',
        '.....HHHHHH.........',
        '......SSSS..........',
        '......SSSS..........',
        '....AAAAAAAA........',
        '...AAAAAAAAAA.......',
        'D..AAAAAAAAAA..D....',
        'D..AAAAAAAAAA..D....',
        '....BBB..BBB........',
        '....BBB..BBB........',
        '....BB....BB........',
        '....................',
        '....................',
        '....................',
        '....................',
    ],
    Paladin: [
        '......HHH...........',
        '.....HHHHH..........',
        '.....HHHHH..........',
        '......SSSS..........',
        '......SSSS..........',
        '....AAAAAAAA........',
        '...AAAAAAAAAA.......',
        'S..AAAGGGAAAA.......',
        'S..AAAGGGAAAA.......',
        'S..AAAAAAAAAA.......',
        'S...BBB..BBB........',
        '....BBB..BBB........',
        '....BB....BB........',
        '....................',
        '....................',
        '....................',
    ],
};

export const EnemyPalettes = {
    Goblin: { '.': null, 'G': '#2ecc71', 'E': '#e74c3c', 'L': '#8d6e63' },
    Skeleton: { '.': null, 'B': '#ecf0f1', 'E': '#3498db' },
    Orc: { '.': null, 'S': '#1e8449', 'A': '#7f8c8d', 'E': '#c0392b' },
    Wraith: { '.': null, 'S': '#8e44ad', 'E': '#f1c40f' },
    Troll: { '.': null, 'S': '#3498db', 'E': '#e74c3c' },
    Dragon: { '.': null, 'S': '#c0392b', 'E': '#f1c40f', 'W': '#e67e22' },
    // New enemies
    Rat: { '.': null, 'S': '#8d6e63', 'E': '#e74c3c', 'T': '#d35400' },
    Slime: { '.': null, 'S': '#27ae60', 'E': '#2ecc71' },
    Bat: { '.': null, 'S': '#2c3e50', 'W': '#34495e', 'E': '#e74c3c' },
    Spider: { '.': null, 'S': '#2c3e50', 'E': '#e74c3c', 'L': '#1a1a2e' },
    Imp: { '.': null, 'S': '#e74c3c', 'E': '#f1c40f', 'W': '#c0392b' },
    Golem: { '.': null, 'S': '#7f8c8d', 'E': '#3498db', 'A': '#95a5a6' },
    Wolf: { '.': null, 'S': '#7f8c8d', 'E': '#f1c40f', 'T': '#ecf0f1' },
    Kobold: { '.': null, 'S': '#d35400', 'E': '#e74c3c', 'L': '#8d6e63' },
    Ghost: { '.': null, 'S': '#bdc3c7', 'E': '#3498db' },
    Zombie: { '.': null, 'S': '#1e8449', 'E': '#e74c3c', 'B': '#8d6e63' },
};

export const EnemySprites = {
    Goblin: [
        '.....GG.....',
        '....GGGG....',
        '...GGGGGG...',
        '...GEGGE....',
        '...GGGGGG...',
        '...LLLLLL...',
        '..LL....LL..',
        '..LL....LL..'
    ],
    Skeleton: [
        '.....BB.....',
        '....BBBB....',
        '...BEBBE....',
        '...BBBBBB...',
        '....BBBB....',
        '...BBBBBB...',
        '..BB....BB..',
        '..BB....BB..'
    ],
    Orc: [
        '....SSSS....',
        '...SSSSSS...',
        '...SESSE....',
        '..SSSSSSSS..',
        '..AAAAAAAA..',
        '.AAAAAAAAAA.',
        '.AA......AA.',
        '.AA......AA.'
    ],
    Wraith: [
        '.....SS.....',
        '....SSSS....',
        '...SESSE....',
        '...SSSSSS...',
        '..SSSSSSSS..',
        '..SSSSSSSS..',
        '..SS....SS..',
        '..S......S..'
    ],
    Troll: [
        '....SSSS....',
        '...SSSSSS...',
        '...SESSE....',
        '..SSSSSSSS..',
        '..SSSSSSSS..',
        '.SSSSSSSSSS.',
        '.SS......SS.',
        '.SS......SS.'
    ],
    Dragon: [
        'WW...SS...WW',
        '.WW.SSSS.WW.',
        '..WWSSSSWW..',
        '...SESSE....',
        '...SSSSSS...',
        '..SSSSSSSS..',
        '.SSSSSSSSSS.',
        '.SS......SS.'
    ],
    Rat: [
        '............',
        '............',
        '....SS......',
        '...SSSE.....',
        '..SSSSSSS...',
        '..SSSSSSSS..',
        '..S....S.T..',
        '............'
    ],
    Slime: [
        '............',
        '............',
        '....SSSS....',
        '...SSSSSS...',
        '..SESSSSES..',
        '..SSSSSSSS..',
        '.SSSSSSSSSS.',
        'SSSSSSSSSSSS'
    ],
    Bat: [
        'WW......WW..',
        '.WW....WW...',
        '..WWSSWW....',
        '...SESSE....',
        '...SSSSSS...',
        '....SSSS....',
        '............',
        '............'
    ],
    Spider: [
        'L...SS...L..',
        '.L.SSSS.L...',
        '..LSESEL....',
        '...SSSSSS...',
        'L.SSSSSSSS.L',
        '.L.S....S.L.',
        '..L......L..',
        '............'
    ],
    Imp: [
        'W....SS...W.',
        '.W..SSSS.W..',
        '...SESSE....',
        '..SSSSSSSS..',
        '..SSSSSSSS..',
        '...SS..SS...',
        '...S....S...',
        '............'
    ],
    Golem: [
        '....AAAA....',
        '...AAAAAA...',
        '...AEAEAA...',
        '..AAAAAAAA..',
        '.SSSSSSSSSS.',
        '.SSSSSSSSSS.',
        '.SS......SS.',
        '.SS......SS.'
    ],
    Wolf: [
        '............',
        '...SS.......',
        '..SSESS.....',
        '..SSSSSSSS..',
        '.TSSSSSSSS..',
        '..SS..SS....',
        '..S...S.....',
        '............'
    ],
    Kobold: [
        '.....SS.....',
        '....SSSE....',
        '...SSSSSS...',
        '..LLLLLLLL..',
        '..LLLLLLLL..',
        '..LL....LL..',
        '..LL....LL..',
        '............'
    ],
    Ghost: [
        '.....SS.....',
        '....SSSS....',
        '...SESSE....',
        '...SSSSSS...',
        '..SSSSSSSS..',
        '..SSSSSSSS..',
        '..S.SS.SS...',
        '............'
    ],
    Zombie: [
        '.....SS.....',
        '....SSSS....',
        '...SESSE....',
        '...BBBBBB...',
        '..BBBBBBBB..',
        '..SS....SS..',
        '..SS....SS..',
        '............'
    ],
};
