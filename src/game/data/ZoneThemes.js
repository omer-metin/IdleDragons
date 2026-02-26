/**
 * Zone theme definitions — controls ground color, ambient particles, and transition FX.
 * Zones map to tiers: 1-3, 4-6, 7-9, 10-12, 13+
 */

const ZONE_THEMES = [
    {
        name: 'Goblin Caves',
        zones: [1, 2, 3],
        groundColor: '#2d2518',
        streakColor: 'rgba(0,0,0,0.25)',
        particleColor: 0xaa9966,    // Dust motes
        particleShape: 'circle',
        particleCount: 15,
        particleSpeed: 0.3,
        particleAlphaBase: 0.15,
        particleSize: [1, 2.5],     // [min, max] radius
    },
    {
        name: 'Haunted Forest',
        zones: [4, 5, 6],
        groundColor: '#1a3a2a',
        streakColor: 'rgba(0,20,0,0.2)',
        particleColor: 0x44aa44,    // Floating leaves
        particleShape: 'rect',
        particleCount: 18,
        particleSpeed: 0.4,
        particleAlphaBase: 0.2,
        particleSize: [1.5, 3],
    },
    {
        name: 'Crimson Wastes',
        zones: [7, 8, 9],
        groundColor: '#3a1a1a',
        streakColor: 'rgba(40,0,0,0.2)',
        particleColor: 0xff6633,    // Rising embers
        particleShape: 'circle',
        particleCount: 22,
        particleSpeed: 0.6,
        particleAlphaBase: 0.25,
        particleSize: [1, 2],
        particleGravity: -0.02,     // Embers rise
    },
    {
        name: 'Void Sanctum',
        zones: [10, 11, 12],
        groundColor: '#1a1a3e',
        streakColor: 'rgba(0,0,40,0.2)',
        particleColor: 0x6666ff,    // Arcane runes
        particleShape: 'rect',
        particleCount: 20,
        particleSpeed: 0.2,
        particleAlphaBase: 0.3,
        particleSize: [2, 4],
    },
    {
        name: "Dragon's Lair",
        zones: null, // 13+
        groundColor: '#1a0a2e',
        streakColor: 'rgba(30,0,30,0.2)',
        particleColor: 0xff9900,    // Fire sparks
        particleShape: 'circle',
        particleCount: 25,
        particleSpeed: 0.8,
        particleAlphaBase: 0.3,
        particleSize: [1, 3],
        particleGravity: -0.03,     // Sparks rise
    },
];

/**
 * Get theme for a given zone number.
 */
export function getThemeForZone(zone) {
    for (const theme of ZONE_THEMES) {
        if (theme.zones && theme.zones.includes(zone)) return theme;
    }
    // 13+ falls through to Dragon's Lair
    return ZONE_THEMES[ZONE_THEMES.length - 1];
}

/**
 * Get the tier index (0-4) for a zone.
 */
export function getThemeTier(zone) {
    if (zone <= 3) return 0;
    if (zone <= 6) return 1;
    if (zone <= 9) return 2;
    if (zone <= 12) return 3;
    return 4;
}

export default ZONE_THEMES;
