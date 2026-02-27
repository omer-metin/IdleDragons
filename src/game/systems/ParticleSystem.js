import * as PIXI from 'pixi.js';

const MAX_POOL_SIZE = 100;

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.pool = []; // Recycled PIXI.Graphics sprites
        this.container = new PIXI.Container();
        this.container.zIndex = 1000; // High z-index to show above units
    }

    /** Get a sprite from pool or create new. */
    _acquireSprite(color, shape) {
        let sprite;
        if (this.pool.length > 0) {
            sprite = this.pool.pop();
            sprite.clear();
        } else {
            sprite = new PIXI.Graphics();
        }
        sprite.beginFill(color);
        if (shape === 'rect') {
            sprite.drawRect(-2, -2, 4, 4);
        } else {
            sprite.drawCircle(0, 0, 3);
        }
        sprite.endFill();
        sprite.alpha = 1;
        sprite.scale.set(1);
        sprite.rotation = 0;
        sprite.visible = true;
        return sprite;
    }

    /** Return a sprite to the pool. */
    _releaseSprite(sprite) {
        sprite.visible = false;
        this.container.removeChild(sprite);
        if (this.pool.length < MAX_POOL_SIZE) {
            this.pool.push(sprite);
        } else {
            sprite.destroy();
        }
    }

    bindContainer(parentContainer) {
        parentContainer.addChild(this.container);
    }

    update(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.life -= delta;

            if (p.life <= 0) {
                this._releaseSprite(p.sprite);
                this.particles.splice(i, 1);
                continue;
            }

            // Physics
            p.x += p.vx * delta;
            p.y += p.vy * delta;

            // Gravity
            if (p.gravity) {
                p.vy += p.gravity * delta;
            }

            // Friction
            if (p.friction) {
                p.vx *= (1 - p.friction);
                p.vy *= (1 - p.friction);
            }

            // Visuals
            p.sprite.x = p.x;
            p.sprite.y = p.y;
            p.sprite.rotation += p.vr * delta;
            p.sprite.alpha = (p.life / p.maxLife) * p.startAlpha;
            const targetScale = p.startScale * (p.life / p.maxLife); // Shrink over time
            p.sprite.scale.set(targetScale);
        }
    }

    spawn(config) {
        const {
            x, y,
            count = 5,
            color = 0xffffff,
            speed = 2,
            life = 60,
            scale = 1,
            spread = Math.PI * 2,
            gravity = 0,
            friction = 0,
        } = config;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * spread - (spread / 2) - (config.angleOffset || 0); // Need check
            // Actually just random angle if spread is 2PI
            const finalAngle = (spread === Math.PI * 2)
                ? Math.random() * Math.PI * 2
                : (config.angle || -Math.PI / 2) + (Math.random() - 0.5) * spread;

            const velocity = (Math.random() * 0.5 + 0.5) * speed;

            const sprite = this._acquireSprite(color, config.shape);

            sprite.x = x;
            sprite.y = y;
            sprite.scale.set(scale);

            this.container.addChild(sprite);

            this.particles.push({
                sprite,
                x, y,
                vx: Math.cos(finalAngle) * velocity,
                vy: Math.sin(finalAngle) * velocity,
                vr: (Math.random() - 0.5) * 0.2, // Rotation speed
                life: life * (0.8 + Math.random() * 0.4), // Random life variation
                maxLife: life,
                startAlpha: 1,
                startScale: scale,
                gravity,
                friction
            });
        }
    }

    // Presets
    emitHit(x, y, color = 0xffffff) {
        this.spawn({
            x, y,
            count: 5,
            color,
            speed: 3,
            life: 20,
            scale: 1,
            spread: Math.PI * 2,
            friction: 0.1
        });
    }

    emitExplosion(x, y, color = 0xe74c3c) {
        this.spawn({
            x, y,
            count: 20,
            color,
            speed: 5,
            life: 45,
            scale: 2,
            spread: Math.PI * 2,
            gravity: 0.1,
            friction: 0.05
        });
    }

    emitLevelUp(x, y) {
        this.spawn({
            x, y: y - 20,
            count: 30,
            color: 0xf1c40f,
            speed: 4,
            life: 60,
            scale: 1.5,
            spread: Math.PI * 2,
            gravity: 0.05,
            friction: 0.02,
            shape: 'rect'
        });
    }

    emitGold(x, y) {
        // Fountain like
        this.spawn({
            x, y,
            count: 8,
            color: 0xf1c40f,
            speed: 4,
            angle: -Math.PI / 2, // Up
            spread: Math.PI / 2,
            life: 50,
            scale: 1.2,
            gravity: 0.2,
            friction: 0.01,
            shape: 'rect'
        });
    }

    emitCrit(x, y) {
        this.spawn({
            x, y,
            count: 12,
            color: 0xff6600,
            speed: 6,
            life: 30,
            scale: 1.8,
            spread: Math.PI * 2,
            gravity: 0,
            friction: 0.08
        });
    }

    emitHealAura(x, y) {
        this.spawn({
            x, y,
            count: 8,
            color: 0x2ecc71,
            speed: 1.5,
            angle: -Math.PI / 2,
            spread: Math.PI / 3,
            life: 45,
            scale: 1,
            gravity: -0.02,
            friction: 0.02
        });
    }

    emitBossSpawn(x, y) {
        this.spawn({
            x, y,
            count: 25,
            color: 0xe74c3c,
            speed: 6,
            life: 50,
            scale: 2.5,
            spread: Math.PI * 2,
            gravity: 0.15,
            friction: 0.04
        });
    }
}

export default new ParticleSystem();
