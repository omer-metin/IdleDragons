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
        '.....RRR....',
        '....RRRRR...',
        '....RRRRR...',
        '....SSSSS...',
        '...AAAAAAA..',
        '..AAAAAAAA..',
        '..AGAAAAAA..',
        '..AGAAAAAA..',
        '..BB....BB..',
        '..BB....BB..',
        'W...........',
        'WW..........'
    ],
    Mage: [
        '.....HH.....',
        '....HHHH....',
        '....SSSS....',
        '...RRRRRR...',
        '..RRRRRRRR..',
        '..RRRRRRRR..',
        '..RR....RR..',
        '..RR....RR..',
        '............',
        '.......W....',
        '.......W....',
        '......OOO...'
    ],
    Archer: [
        '.....HH.....',
        '....HHHH....',
        '....SSSS....',
        '...TTTTTT...',
        '..TTTTTTTT..',
        '..TTTTTTTT..',
        '..LL....LL..',
        '..LL....LL..',
        'B...........',
        'BB..........',
        'B...........',
        '............'
    ],
    Cleric: [
        '.....HH.....',
        '....HHHH....',
        '....SSSS....',
        '...RRRRRR...',
        '...WWWWWW...',
        '...RRRRRR...',
        '...RRRRRR...',
        '..RR....RR..',
        '............',
        'G.....G.....',
        'G.....G.....',
        '............'
    ],
    Rogue: [
        '.....HH.....',
        '....HHHHH...',
        '....SSSS....',
        '...AAAAAA...',
        '..AAAAAAAA..',
        'D.AAAAAAAA.D',
        'D.BB....BB.D',
        '..BB....BB..',
        '............',
        '............',
        '............',
        '............'
    ],
    Paladin: [
        '.....HH.....',
        '....HHHHH...',
        '....SSSS....',
        '...AAAAAA...',
        '..AAAAAAAA..',
        'S.AAAGGAAA..',
        'S.AAAGGAAA..',
        'S.BB....BB..',
        'S.BB....BB..',
        '............',
        '............',
        '............'
    ]
};

export const EnemyPalettes = {
    Goblin: { '.': null, 'G': '#2ecc71', 'E': '#e74c3c', 'L': '#8d6e63' }, // Green skin, Red eyes, Leather
    Skeleton: { '.': null, 'B': '#ecf0f1', 'E': '#3498db' }, // Bone white, Blue eyes
    Orc: { '.': null, 'S': '#1e8449', 'A': '#7f8c8d', 'E': '#c0392b' }, // Dark Green, Grey Armor, Red eyes
    Wraith: { '.': null, 'S': '#8e44ad', 'E': '#f1c40f' }, // Purple, Yellow eyes
    Troll: { '.': null, 'S': '#3498db', 'E': '#e74c3c' }, // Blue skin
    Dragon: { '.': null, 'S': '#c0392b', 'E': '#f1c40f', 'W': '#e67e22' }, // Red skin, Yellow eyes, Orange wings
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
    ]
};
