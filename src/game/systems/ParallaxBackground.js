import * as PIXI from 'pixi.js';

/**
 * Procedural parallax background renderer.
 * 3 layers (far, mid, near) that scroll at different speeds.
 * Each layer is a TilingSprite with procedurally drawn canvas textures.
 */
class ParallaxBackground {
    constructor() {
        this.container = new PIXI.Container();
        this.container.zIndex = -10000;
        this.layers = [];
        this.currentThemeName = null;
    }

    /**
     * Build or rebuild all 3 parallax layers for the given theme.
     */
    buildForTheme(theme, screenW, screenH) {
        if (this.currentThemeName === theme.name) return;
        this.currentThemeName = theme.name;

        // Destroy old layers
        for (const layer of this.layers) {
            this.container.removeChild(layer.sprite);
            layer.sprite.destroy(true);
        }
        this.layers = [];

        const layerDefs = [
            { key: 'far',  def: theme.parallax.far,  zIndex: -10003 },
            { key: 'mid',  def: theme.parallax.mid,  zIndex: -10002 },
            { key: 'near', def: theme.parallax.near,  zIndex: -10001 },
        ];

        for (const { key, def, zIndex } of layerDefs) {
            const canvas = this._drawLayer(def, theme, screenW, screenH);
            const texture = PIXI.Texture.from(canvas);
            texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

            const sprite = new PIXI.TilingSprite(texture, screenW + 600, screenH + 600);
            sprite.anchor.set(0.5);
            sprite.zIndex = zIndex;
            sprite.alpha = key === 'far' ? 1.0 : key === 'mid' ? 0.85 : 0.7;

            this.container.addChild(sprite);
            this.layers.push({ sprite, speed: def.speed, key });
        }
    }

    /**
     * Procedurally draw a single parallax layer canvas.
     */
    _drawLayer(def, theme, screenW, screenH) {
        const w = 512;
        const h = 512;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        // Base fill
        ctx.fillStyle = def.color;
        ctx.fillRect(0, 0, w, h);

        // Draw layer-specific elements
        const draw = LAYER_DRAWERS[def.elements];
        if (draw) {
            draw(ctx, w, h, theme, def);
        }

        return canvas;
    }

    /**
     * Scroll layers. Call each frame when the game is running.
     */
    update(delta, isRunning) {
        for (const layer of this.layers) {
            if (layer.sprite.tilePosition && isRunning) {
                layer.sprite.tilePosition.x -= layer.speed * delta;
            }
        }
    }

    /**
     * Resize all layers to cover the screen.
     */
    resize(w, h) {
        for (const layer of this.layers) {
            layer.sprite.width = w + 600;
            layer.sprite.height = h + 600;
        }
    }
}

// ─── Procedural layer drawing functions ───────────────────────────

const LAYER_DRAWERS = {
    // ── Goblin Caves ──
    stalactites(ctx, w, h) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        for (let i = 0; i < 8; i++) {
            const x = (i / 8) * w + Math.random() * 30;
            const bw = 15 + Math.random() * 25;
            const bh = 60 + Math.random() * 100;
            // Stalactite triangle from top
            ctx.beginPath();
            ctx.moveTo(x - bw / 2, 0);
            ctx.lineTo(x + bw / 2, 0);
            ctx.lineTo(x, bh);
            ctx.fill();
        }
        // Stalagmites from bottom
        ctx.fillStyle = 'rgba(30,20,10,0.5)';
        for (let i = 0; i < 6; i++) {
            const x = (i / 6) * w + Math.random() * 40;
            const bw = 12 + Math.random() * 20;
            const bh = 30 + Math.random() * 60;
            ctx.beginPath();
            ctx.moveTo(x - bw / 2, h);
            ctx.lineTo(x + bw / 2, h);
            ctx.lineTo(x, h - bh);
            ctx.fill();
        }
    },

    torches(ctx, w, h) {
        for (let i = 0; i < 4; i++) {
            const x = (i / 4) * w + 60;
            const y = h * 0.3 + Math.random() * h * 0.3;
            // Torch bracket
            ctx.fillStyle = 'rgba(80,60,30,0.6)';
            ctx.fillRect(x - 2, y - 20, 4, 20);
            // Flame glow
            const grad = ctx.createRadialGradient(x, y - 25, 2, x, y - 25, 30);
            grad.addColorStop(0, 'rgba(255,180,50,0.4)');
            grad.addColorStop(1, 'rgba(255,100,20,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(x - 30, y - 55, 60, 60);
            // Flame
            ctx.fillStyle = 'rgba(255,200,80,0.8)';
            ctx.beginPath();
            ctx.arc(x, y - 25, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    rocks(ctx, w, h) {
        ctx.fillStyle = 'rgba(50,40,25,0.4)';
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * w;
            const y = h * 0.6 + Math.random() * h * 0.4;
            const r = 5 + Math.random() * 15;
            ctx.beginPath();
            ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        // Moss streaks
        ctx.fillStyle = 'rgba(40,80,30,0.2)';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 40 + 10, 2);
        }
    },

    // ── Haunted Forest ──
    dead_trees_far(ctx, w, h) {
        ctx.fillStyle = 'rgba(10,30,15,0.5)';
        for (let i = 0; i < 5; i++) {
            const x = (i / 5) * w + Math.random() * 40;
            const trunkW = 6 + Math.random() * 8;
            const trunkH = 120 + Math.random() * 100;
            // Trunk
            ctx.fillRect(x - trunkW / 2, h - trunkH, trunkW, trunkH);
            // Canopy (dead, sparse)
            ctx.beginPath();
            ctx.arc(x, h - trunkH - 20, 30 + Math.random() * 20, 0, Math.PI * 2);
            ctx.fill();
        }
        // Fog
        const fogGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
        fogGrad.addColorStop(0, 'rgba(100,140,100,0)');
        fogGrad.addColorStop(1, 'rgba(100,140,100,0.15)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, h * 0.6, w, h * 0.4);
    },

    twisted_trees(ctx, w, h) {
        ctx.fillStyle = 'rgba(20,50,25,0.6)';
        for (let i = 0; i < 4; i++) {
            const x = (i / 4) * w + 40 + Math.random() * 30;
            const trunkH = 100 + Math.random() * 80;
            // Twisted trunk (S-curve)
            ctx.lineWidth = 8;
            ctx.strokeStyle = 'rgba(30,15,8,0.5)';
            ctx.beginPath();
            ctx.moveTo(x, h);
            ctx.bezierCurveTo(x - 20, h - trunkH * 0.5, x + 20, h - trunkH * 0.8, x - 5, h - trunkH);
            ctx.stroke();
            // Branches
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 5, h - trunkH);
            ctx.lineTo(x - 30, h - trunkH - 30);
            ctx.moveTo(x - 5, h - trunkH);
            ctx.lineTo(x + 25, h - trunkH - 25);
            ctx.stroke();
        }
        // Fireflies
        ctx.fillStyle = 'rgba(100,255,100,0.6)';
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    mushrooms(ctx, w, h) {
        for (let i = 0; i < 6; i++) {
            const x = Math.random() * w;
            const y = h * 0.7 + Math.random() * h * 0.25;
            const capR = 6 + Math.random() * 10;
            // Stem
            ctx.fillStyle = 'rgba(160,140,120,0.4)';
            ctx.fillRect(x - 2, y, 4, capR);
            // Cap (glowing)
            ctx.fillStyle = 'rgba(80,200,80,0.3)';
            ctx.beginPath();
            ctx.ellipse(x, y, capR, capR * 0.6, 0, Math.PI, 0);
            ctx.fill();
            // Glow
            const glow = ctx.createRadialGradient(x, y, capR * 0.5, x, y, capR * 2);
            glow.addColorStop(0, 'rgba(80,255,80,0.15)');
            glow.addColorStop(1, 'rgba(80,255,80,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(x - capR * 2, y - capR * 2, capR * 4, capR * 4);
        }
    },

    // ── Crimson Wastes ──
    volcanoes(ctx, w, h) {
        // Distant volcano silhouettes
        ctx.fillStyle = 'rgba(20,5,5,0.6)';
        for (let i = 0; i < 3; i++) {
            const x = (i / 3) * w + 50 + Math.random() * 60;
            const baseW = 100 + Math.random() * 80;
            const peakH = 150 + Math.random() * 100;
            ctx.beginPath();
            ctx.moveTo(x - baseW, h);
            ctx.lineTo(x - 15, h - peakH);
            ctx.lineTo(x + 15, h - peakH);
            ctx.lineTo(x + baseW, h);
            ctx.fill();
            // Lava glow at peak
            const glow = ctx.createRadialGradient(x, h - peakH, 5, x, h - peakH, 40);
            glow.addColorStop(0, 'rgba(255,100,20,0.4)');
            glow.addColorStop(1, 'rgba(255,50,0,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(x - 40, h - peakH - 40, 80, 80);
            ctx.fillStyle = 'rgba(20,5,5,0.6)';
        }
        // Red sky haze
        const haze = ctx.createLinearGradient(0, 0, 0, h * 0.4);
        haze.addColorStop(0, 'rgba(100,20,0,0.2)');
        haze.addColorStop(1, 'rgba(100,20,0,0)');
        ctx.fillStyle = haze;
        ctx.fillRect(0, 0, w, h * 0.4);
    },

    lava_rocks(ctx, w, h) {
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * w;
            const y = h * 0.4 + Math.random() * h * 0.5;
            const r = 8 + Math.random() * 20;
            // Dark rock
            ctx.fillStyle = 'rgba(40,15,10,0.5)';
            ctx.beginPath();
            // Jagged polygon
            const points = 5 + Math.floor(Math.random() * 3);
            for (let j = 0; j < points; j++) {
                const angle = (j / points) * Math.PI * 2;
                const jr = r * (0.7 + Math.random() * 0.3);
                const px = x + Math.cos(angle) * jr;
                const py = y + Math.sin(angle) * jr;
                j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            // Lava cracks
            ctx.strokeStyle = 'rgba(255,80,20,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - r * 0.5, y);
            ctx.lineTo(x + r * 0.5, y + r * 0.3);
            ctx.stroke();
        }
    },

    cracks(ctx, w, h) {
        ctx.strokeStyle = 'rgba(255,60,10,0.25)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
            let x = Math.random() * w;
            let y = h * 0.6 + Math.random() * h * 0.4;
            ctx.beginPath();
            ctx.moveTo(x, y);
            for (let j = 0; j < 4; j++) {
                x += (Math.random() - 0.5) * 30;
                y += Math.random() * 15;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        // Heat shimmer spots
        for (let i = 0; i < 4; i++) {
            const glow = ctx.createRadialGradient(
                Math.random() * w, h * 0.8 + Math.random() * h * 0.2, 3,
                Math.random() * w, h * 0.8, 25
            );
            glow.addColorStop(0, 'rgba(255,120,40,0.15)');
            glow.addColorStop(1, 'rgba(255,60,20,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, w, h);
        }
    },

    // ── Frozen Citadel ──
    aurora(ctx, w, h) {
        // Dark sky with aurora streaks
        for (let band = 0; band < 3; band++) {
            const y = 40 + band * 60 + Math.random() * 30;
            const grad = ctx.createLinearGradient(0, y - 20, 0, y + 20);
            const hue = 120 + band * 40 + Math.random() * 30;
            grad.addColorStop(0, `hsla(${hue},70%,50%,0)`);
            grad.addColorStop(0.5, `hsla(${hue},70%,50%,0.12)`);
            grad.addColorStop(1, `hsla(${hue},70%,50%,0)`);
            ctx.fillStyle = grad;
            // Wavy band
            ctx.beginPath();
            ctx.moveTo(0, y - 15);
            for (let x = 0; x <= w; x += 10) {
                ctx.lineTo(x, y - 15 + Math.sin(x * 0.02 + band) * 10);
            }
            for (let x = w; x >= 0; x -= 10) {
                ctx.lineTo(x, y + 15 + Math.sin(x * 0.02 + band + 1) * 10);
            }
            ctx.closePath();
            ctx.fill();
        }
        // Stars
        ctx.fillStyle = 'rgba(200,220,255,0.5)';
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h * 0.5, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    ice_pillars(ctx, w, h) {
        for (let i = 0; i < 5; i++) {
            const x = (i / 5) * w + 30 + Math.random() * 40;
            const pillarW = 12 + Math.random() * 15;
            const pillarH = 100 + Math.random() * 120;
            // Ice pillar body
            const iceGrad = ctx.createLinearGradient(x - pillarW / 2, 0, x + pillarW / 2, 0);
            iceGrad.addColorStop(0, 'rgba(120,180,220,0.25)');
            iceGrad.addColorStop(0.5, 'rgba(180,220,255,0.35)');
            iceGrad.addColorStop(1, 'rgba(120,180,220,0.25)');
            ctx.fillStyle = iceGrad;
            ctx.fillRect(x - pillarW / 2, h - pillarH, pillarW, pillarH);
            // Shine line
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(x - 1, h - pillarH + 10, 2, pillarH - 20);
        }
    },

    snow_drifts(ctx, w, h) {
        ctx.fillStyle = 'rgba(200,220,240,0.2)';
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * w;
            const y = h * 0.7 + Math.random() * h * 0.3;
            const rx = 20 + Math.random() * 40;
            const ry = 8 + Math.random() * 12;
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        // Snowflake dots
        ctx.fillStyle = 'rgba(220,240,255,0.3)';
        for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // ── Void Sanctum ──
    void_sky(ctx, w, h) {
        // Shattered reality cracks
        ctx.strokeStyle = 'rgba(130,80,255,0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            let x = Math.random() * w;
            let y = Math.random() * h;
            ctx.beginPath();
            ctx.moveTo(x, y);
            for (let j = 0; j < 5; j++) {
                x += (Math.random() - 0.5) * 60;
                y += (Math.random() - 0.5) * 60;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        // Purple nebula patches
        for (let i = 0; i < 4; i++) {
            const glow = ctx.createRadialGradient(
                Math.random() * w, Math.random() * h, 5,
                Math.random() * w, Math.random() * h, 60
            );
            glow.addColorStop(0, 'rgba(100,50,200,0.1)');
            glow.addColorStop(1, 'rgba(60,20,120,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, w, h);
        }
    },

    floating_ruins(ctx, w, h) {
        ctx.fillStyle = 'rgba(40,30,60,0.4)';
        for (let i = 0; i < 4; i++) {
            const x = (i / 4) * w + 40 + Math.random() * 50;
            const y = h * 0.3 + Math.random() * h * 0.4;
            const bw = 30 + Math.random() * 40;
            const bh = 20 + Math.random() * 30;
            // Floating platform
            ctx.fillRect(x - bw / 2, y, bw, bh);
            // Broken column on top
            ctx.fillRect(x - 4, y - 25 - Math.random() * 20, 8, 25 + Math.random() * 20);
            // Arcane glow underneath
            const glow = ctx.createRadialGradient(x, y + bh, 5, x, y + bh, 30);
            glow.addColorStop(0, 'rgba(130,80,255,0.2)');
            glow.addColorStop(1, 'rgba(130,80,255,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(x - 30, y + bh - 10, 60, 40);
            ctx.fillStyle = 'rgba(40,30,60,0.4)';
        }
    },

    sigils(ctx, w, h) {
        ctx.strokeStyle = 'rgba(130,100,255,0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const r = 10 + Math.random() * 20;
            // Arcane circle
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.stroke();
            // Inner star
            ctx.beginPath();
            for (let j = 0; j < 5; j++) {
                const angle = (j / 5) * Math.PI * 2 - Math.PI / 2;
                const px = x + Math.cos(angle) * r * 0.6;
                const py = y + Math.sin(angle) * r * 0.6;
                j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
        }
    },

    // ── Dragon's Lair ──
    magma_sky(ctx, w, h) {
        // Dark with lava glow from below
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(15,5,20,0)');
        grad.addColorStop(0.7, 'rgba(60,15,5,0.1)');
        grad.addColorStop(1, 'rgba(120,30,10,0.2)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        // Smoke wisps
        ctx.fillStyle = 'rgba(40,20,30,0.15)';
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.ellipse(Math.random() * w, Math.random() * h * 0.6, 30 + Math.random() * 40, 10 + Math.random() * 15, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    dragon_bones(ctx, w, h) {
        ctx.fillStyle = 'rgba(180,160,140,0.2)';
        for (let i = 0; i < 3; i++) {
            const x = (i / 3) * w + 60 + Math.random() * 40;
            const y = h * 0.4 + Math.random() * h * 0.3;
            // Rib cage shape
            for (let j = 0; j < 4; j++) {
                ctx.beginPath();
                ctx.ellipse(x, y + j * 12, 25 + j * 3, 5, 0.1 * j, 0, Math.PI);
                ctx.stroke();
            }
            // Skull
            ctx.beginPath();
            ctx.ellipse(x - 30, y - 10, 15, 10, -0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    gold_piles(ctx, w, h) {
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * w;
            const y = h * 0.7 + Math.random() * h * 0.25;
            const r = 10 + Math.random() * 20;
            // Pile shape
            ctx.fillStyle = 'rgba(200,160,40,0.2)';
            ctx.beginPath();
            ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Shine dots
            ctx.fillStyle = 'rgba(255,220,100,0.3)';
            for (let j = 0; j < 4; j++) {
                ctx.beginPath();
                ctx.arc(x + (Math.random() - 0.5) * r, y + (Math.random() - 0.5) * r * 0.4, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },

    // ── Astral Plane ──
    star_field(ctx, w, h) {
        // Dense star field
        for (let i = 0; i < 80; i++) {
            const bright = Math.random();
            ctx.fillStyle = `rgba(200,200,255,${bright * 0.6})`;
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, 0.5 + bright * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        // Nebula cloud
        for (let i = 0; i < 3; i++) {
            const glow = ctx.createRadialGradient(
                Math.random() * w, Math.random() * h, 10,
                Math.random() * w, Math.random() * h, 80
            );
            const hue = 240 + Math.random() * 60;
            glow.addColorStop(0, `hsla(${hue},60%,60%,0.08)`);
            glow.addColorStop(1, `hsla(${hue},60%,30%,0)`);
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, w, h);
        }
    },

    cosmic_dust(ctx, w, h) {
        // Swirling dust lanes
        ctx.strokeStyle = 'rgba(180,150,255,0.1)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            const startX = Math.random() * w;
            const startY = Math.random() * h;
            ctx.moveTo(startX, startY);
            for (let j = 0; j < 8; j++) {
                ctx.lineTo(
                    startX + j * 50 + Math.sin(j * 0.8) * 30,
                    startY + Math.cos(j * 0.6) * 40
                );
            }
            ctx.stroke();
        }
        // Bright cosmic particles
        ctx.fillStyle = 'rgba(200,180,255,0.4)';
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    ethereal_platforms(ctx, w, h) {
        for (let i = 0; i < 4; i++) {
            const x = (i / 4) * w + 30 + Math.random() * 60;
            const y = h * 0.5 + Math.random() * h * 0.4;
            const pw = 40 + Math.random() * 50;
            const ph = 8 + Math.random() * 6;
            // Platform
            const grad = ctx.createLinearGradient(x - pw / 2, y, x + pw / 2, y);
            grad.addColorStop(0, 'rgba(150,130,255,0)');
            grad.addColorStop(0.5, 'rgba(150,130,255,0.2)');
            grad.addColorStop(1, 'rgba(150,130,255,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(x - pw / 2, y, pw, ph);
            // Glow below
            const glow = ctx.createRadialGradient(x, y + ph, 5, x, y + ph + 20, 30);
            glow.addColorStop(0, 'rgba(130,100,255,0.12)');
            glow.addColorStop(1, 'rgba(130,100,255,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(x - 30, y + ph, 60, 40);
        }
    },
};

export default new ParallaxBackground();
