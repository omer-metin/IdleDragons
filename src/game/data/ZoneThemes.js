/**
 * Zone theme definitions — controls backgrounds, parallax layers, ambient particles,
 * environmental props, transition FX, and UI color-grading.
 *
 * 7 tiers: Goblin Caves → Haunted Forest → Crimson Wastes → Frozen Citadel
 *        → Void Sanctum → Dragon's Lair → Astral Plane
 */

const ZONE_THEMES = [
    {
        name: 'Goblin Caves',
        zones: [1, 2, 3],

        // Ground
        groundColor: '#2d2518',
        streakColor: 'rgba(0,0,0,0.25)',

        // Parallax layers (far → near), drawn procedurally
        parallax: {
            far:  { color: '#1a1510', speed: 0.3, elements: 'stalactites' },
            mid:  { color: '#2a1f14', speed: 0.8, elements: 'torches' },
            near: { color: '#3d3020', speed: 1.5, elements: 'rocks' },
        },

        // Ambient particles
        particleColor: 0xaa9966,
        particleShape: 'circle',
        particleCount: 15,
        particleSpeed: 0.3,
        particleAlphaBase: 0.15,
        particleSize: [1, 2.5],

        // Environmental props
        props: [
            { type: 'stalactite', count: 4, yRange: [-300, -200] },
            { type: 'torch', count: 2, yRange: [-100, 50] },
            { type: 'rock', count: 5, yRange: [50, 150] },
        ],

        // UI color grading
        uiAccent: '#c9a96e',
        uiBorder: '#6b5530',
        uiGlow: 'rgba(201,169,110,0.15)',
        splashColor: '#c9a96e',
    },
    {
        name: 'Haunted Forest',
        zones: [4, 5, 6],

        groundColor: '#1a3a2a',
        streakColor: 'rgba(0,20,0,0.2)',

        parallax: {
            far:  { color: '#0d1f15', speed: 0.2, elements: 'dead_trees_far' },
            mid:  { color: '#152e20', speed: 0.6, elements: 'twisted_trees' },
            near: { color: '#1e4030', speed: 1.4, elements: 'mushrooms' },
        },

        particleColor: 0x44aa44,
        particleShape: 'rect',
        particleCount: 18,
        particleSpeed: 0.4,
        particleAlphaBase: 0.2,
        particleSize: [1.5, 3],

        props: [
            { type: 'dead_tree', count: 3, yRange: [-250, -100] },
            { type: 'mushroom', count: 4, yRange: [30, 130] },
            { type: 'gravestone', count: 2, yRange: [60, 140] },
        ],

        uiAccent: '#4ade80',
        uiBorder: '#1a5c30',
        uiGlow: 'rgba(74,222,128,0.12)',
        splashColor: '#4ade80',
    },
    {
        name: 'Crimson Wastes',
        zones: [7, 8, 9],

        groundColor: '#3a1a1a',
        streakColor: 'rgba(40,0,0,0.2)',

        parallax: {
            far:  { color: '#2a0a0a', speed: 0.25, elements: 'volcanoes' },
            mid:  { color: '#3a1510', speed: 0.7, elements: 'lava_rocks' },
            near: { color: '#4a2018', speed: 1.5, elements: 'cracks' },
        },

        particleColor: 0xff6633,
        particleShape: 'circle',
        particleCount: 22,
        particleSpeed: 0.6,
        particleAlphaBase: 0.25,
        particleSize: [1, 2],
        particleGravity: -0.02,

        props: [
            { type: 'lava_pool', count: 2, yRange: [40, 130] },
            { type: 'volcanic_rock', count: 4, yRange: [-150, 100] },
            { type: 'ash_cloud', count: 3, yRange: [-300, -180] },
        ],

        uiAccent: '#f87171',
        uiBorder: '#7f1d1d',
        uiGlow: 'rgba(248,113,113,0.15)',
        splashColor: '#f87171',
    },
    {
        name: 'Frozen Citadel',
        zones: [10, 11, 12],

        groundColor: '#1a2a3e',
        streakColor: 'rgba(100,150,200,0.15)',

        parallax: {
            far:  { color: '#0c1525', speed: 0.2, elements: 'aurora' },
            mid:  { color: '#152535', speed: 0.6, elements: 'ice_pillars' },
            near: { color: '#1e3550', speed: 1.3, elements: 'snow_drifts' },
        },

        particleColor: 0xaaddff,
        particleShape: 'circle',
        particleCount: 25,
        particleSpeed: 0.5,
        particleAlphaBase: 0.3,
        particleSize: [1, 3],
        particleGravity: 0.01,

        props: [
            { type: 'ice_pillar', count: 3, yRange: [-200, -50] },
            { type: 'snow_drift', count: 4, yRange: [50, 150] },
            { type: 'frozen_chain', count: 2, yRange: [-150, 0] },
        ],

        uiAccent: '#93c5fd',
        uiBorder: '#1e3a5f',
        uiGlow: 'rgba(147,197,253,0.15)',
        splashColor: '#93c5fd',
    },
    {
        name: 'Void Sanctum',
        zones: [13, 14, 15],

        groundColor: '#1a1a3e',
        streakColor: 'rgba(0,0,40,0.2)',

        parallax: {
            far:  { color: '#0a0a20', speed: 0.15, elements: 'void_sky' },
            mid:  { color: '#151530', speed: 0.5, elements: 'floating_ruins' },
            near: { color: '#202045', speed: 1.2, elements: 'sigils' },
        },

        particleColor: 0x8866ff,
        particleShape: 'rect',
        particleCount: 20,
        particleSpeed: 0.2,
        particleAlphaBase: 0.3,
        particleSize: [2, 4],

        props: [
            { type: 'floating_ruin', count: 3, yRange: [-250, -100] },
            { type: 'arcane_sigil', count: 4, yRange: [-100, 100] },
            { type: 'energy_stream', count: 2, yRange: [-50, 80] },
        ],

        uiAccent: '#a78bfa',
        uiBorder: '#3b1f8e',
        uiGlow: 'rgba(167,139,250,0.15)',
        splashColor: '#a78bfa',
    },
    {
        name: "Dragon's Lair",
        zones: [16, 17, 18],

        groundColor: '#1a0a2e',
        streakColor: 'rgba(30,0,30,0.2)',

        parallax: {
            far:  { color: '#100518', speed: 0.2, elements: 'magma_sky' },
            mid:  { color: '#1e0a28', speed: 0.6, elements: 'dragon_bones' },
            near: { color: '#2a1035', speed: 1.4, elements: 'gold_piles' },
        },

        particleColor: 0xff9900,
        particleShape: 'circle',
        particleCount: 25,
        particleSpeed: 0.8,
        particleAlphaBase: 0.3,
        particleSize: [1, 3],
        particleGravity: -0.03,

        props: [
            { type: 'gold_pile', count: 3, yRange: [40, 140] },
            { type: 'dragon_bone', count: 2, yRange: [-180, -40] },
            { type: 'obsidian_column', count: 3, yRange: [-220, -60] },
        ],

        uiAccent: '#fbbf24',
        uiBorder: '#78350f',
        uiGlow: 'rgba(251,191,36,0.15)',
        splashColor: '#fbbf24',
    },
    {
        name: 'Astral Plane',
        zones: null, // 19+

        groundColor: '#0a0a1e',
        streakColor: 'rgba(20,0,40,0.15)',

        parallax: {
            far:  { color: '#050510', speed: 0.1, elements: 'star_field' },
            mid:  { color: '#0a0a1a', speed: 0.4, elements: 'cosmic_dust' },
            near: { color: '#10102a', speed: 1.0, elements: 'ethereal_platforms' },
        },

        particleColor: 0xccaaff,
        particleShape: 'circle',
        particleCount: 30,
        particleSpeed: 0.15,
        particleAlphaBase: 0.4,
        particleSize: [1, 2],

        props: [
            { type: 'reality_tear', count: 2, yRange: [-200, 0] },
            { type: 'cosmic_crystal', count: 3, yRange: [-150, 100] },
            { type: 'ethereal_platform', count: 2, yRange: [30, 120] },
        ],

        uiAccent: '#c4b5fd',
        uiBorder: '#4c1d95',
        uiGlow: 'rgba(196,181,253,0.2)',
        splashColor: '#c4b5fd',
    },
];

/**
 * Get theme for a given zone number.
 */
export function getThemeForZone(zone) {
    for (const theme of ZONE_THEMES) {
        if (theme.zones && theme.zones.includes(zone)) return theme;
    }
    // 19+ falls through to Astral Plane
    return ZONE_THEMES[ZONE_THEMES.length - 1];
}

/**
 * Get the tier index (0-6) for a zone.
 */
export function getThemeTier(zone) {
    if (zone <= 3) return 0;
    if (zone <= 6) return 1;
    if (zone <= 9) return 2;
    if (zone <= 12) return 3;
    if (zone <= 15) return 4;
    if (zone <= 18) return 5;
    return 6;
}

export default ZONE_THEMES;
