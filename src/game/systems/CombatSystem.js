import * as PIXI from 'pixi.js';
import usePartyStore from '../../store/usePartyStore';
import AudioManager from '../../audio/AudioManager';

class CombatSystem {
    constructor() {
        this.scene = null;
    }

    bindScene(scene) {
        this.scene = scene;
    }

    getDistance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getNearestEnemy(source) {
        if (!this.scene) return null;
        let nearest = null;
        let minDist = Infinity;

        for (const enemy of this.scene.enemyMap.values()) {
            if (enemy.hp <= 0) continue;
            const dist = this.getDistance(source, enemy);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    getNearestHero(source) {
        if (!this.scene) return null;
        let nearest = null;
        let minDist = Infinity;

        for (const hero of this.scene.characterMap.values()) {
            if (hero.isDead) continue; // Skip dead heroes
            const dist = this.getDistance(source, hero);
            if (dist < minDist) {
                minDist = dist;
                nearest = hero;
            }
        }
        return nearest;
    }

    // Hero attacks Enemy
    dealDamage(source, target, amount) {
        if (!target || target.hp <= 0) return;

        const defense = target.def || 0;
        const finalDmg = Math.max(1, Math.floor(amount - defense * 0.5));

        target.takeDamage(finalDmg);
        this.showDamageText(target, finalDmg, false);

        // SFX based on source class
        const cls = source.data?.class;
        if (cls === 'Archer') AudioManager.playSFX('hit_arrow');
        else if (cls === 'Mage') AudioManager.playSFX('hit_magic');
        else AudioManager.playSFX('hit_melee');
    }

    // Enemy attacks Hero
    dealDamageToHero(source, target, amount) {
        if (!target || target.isDead) return;

        const finalDmg = target.takeDamage(amount);
        if (finalDmg > 0) {
            this.showDamageText(target, finalDmg, true);
            AudioManager.playSFX('hit_enemy_attack');
        }
    }

    showDamageText(target, amount, isHeroDamage = false) {
        if (!this.scene) return;

        const style = new PIXI.TextStyle({
            fontFamily: 'Inter, sans-serif',
            fontSize: isHeroDamage ? 16 : 20,
            fontWeight: 'bold',
            fill: isHeroDamage ? '#e74c3c' : (amount > 15 ? '#f1c40f' : '#ffffff'),
            stroke: '#000000',
            strokeThickness: 3,
        });

        const text = new PIXI.Text(`-${amount}`, style);
        text.x = target.x + (Math.random() - 0.5) * 20;
        text.y = target.y - 40;
        text.anchor.set(0.5);

        this.scene.vfxContainer.addChild(text);

        let elapsed = 0;
        const duration = 60;
        const tick = (delta) => {
            elapsed += delta;
            text.y -= 1.5 * delta;
            text.alpha = 1 - (elapsed / duration);
            text.scale.set(1 + (elapsed / duration) * 0.5);

            if (elapsed >= duration) {
                this.scene.app.ticker.remove(tick);
                this.scene.vfxContainer.removeChild(text);
                text.destroy();
            }
        };

        this.scene.app.ticker.add(tick);
        if (!isHeroDamage) {
            this.showHitEffect(target);
        }
    }

    showHitEffect(target) {
        if (!this.scene) return;

        for (let i = 0; i < 6; i++) {
            const p = new PIXI.Graphics();
            const color = 0xf39c12;
            p.beginFill(color);
            p.drawRect(-2, -2, 4, 4);
            p.endFill();

            p.x = target.x;
            p.y = target.y - 20;

            this.scene.vfxContainer.addChild(p);

            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            let pElapsed = 0;
            const pTick = (delta) => {
                pElapsed += delta;
                p.x += vx * delta;
                p.y += vy * delta;
                p.alpha = 1 - (pElapsed / 30);

                if (pElapsed >= 30) {
                    this.scene.app.ticker.remove(pTick);
                    this.scene.vfxContainer.removeChild(p);
                    p.destroy();
                }
            };
            this.scene.app.ticker.add(pTick);
        }
    }

    showDeathEffect(target) {
        if (!this.scene) return;

        // Explosion of particles
        for (let i = 0; i < 15; i++) {
            const p = new PIXI.Graphics();
            p.beginFill(target.isBoss ? 0xf1c40f : 0x8e44ad);
            p.drawCircle(0, 0, 3 + Math.random() * 3);
            p.endFill();
            p.x = target.x;
            p.y = target.y - 20;
            this.scene.vfxContainer.addChild(p);

            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            let alpha = 1.0;
            const tick = (delta) => {
                p.x += vx * delta;
                p.y += vy * delta;
                p.alpha -= 0.03 * delta;
                if (p.alpha <= 0) {
                    this.scene.app.ticker.remove(tick);
                    p.destroy();
                }
            };
            this.scene.app.ticker.add(tick);
        }
    }

    // Find lowest HP hero (for Cleric healing)
    getLowestHpHero(healer) {
        if (!this.scene) return null;
        let lowestTarget = null;
        let lowestRatio = 1;

        for (const hero of this.scene.characterMap.values()) {
            if (hero.isDead || hero.isSleeping) continue;
            if (hero.id === healer.id) continue; // Don't self-heal (prioritize others)

            const maxHp = hero.data.stats?.hp || 100;
            const currentHp = hero.data.currentHp ?? maxHp;
            const ratio = currentHp / maxHp;

            if (ratio < lowestRatio) {
                lowestRatio = ratio;
                lowestTarget = hero;
            }
        }

        // If no damaged allies, self-heal if needed
        if (!lowestTarget) {
            const maxHp = healer.data.stats?.hp || 100;
            const currentHp = healer.data.currentHp ?? maxHp;
            if (currentHp < maxHp) return healer;
        }

        return lowestTarget;
    }

    showHealText(target, amount) {
        if (!this.scene) return;

        const style = new PIXI.TextStyle({
            fontFamily: 'Inter, sans-serif',
            fontSize: 16,
            fontWeight: 'bold',
            fill: '#2ecc71',
            stroke: '#000000',
            strokeThickness: 3,
        });

        const text = new PIXI.Text(`+${amount}`, style);
        text.x = target.x + (Math.random() - 0.5) * 20;
        text.y = target.y - 40;
        text.anchor.set(0.5);

        this.scene.vfxContainer.addChild(text);

        let elapsed = 0;
        const duration = 50;
        const tick = (delta) => {
            elapsed += delta;
            text.y -= 1 * delta;
            text.alpha = 1 - (elapsed / duration);

            if (elapsed >= duration) {
                this.scene.app.ticker.remove(tick);
                this.scene.vfxContainer.removeChild(text);
                text.destroy();
            }
        };

        this.scene.app.ticker.add(tick);
        AudioManager.playSFX('heal');
    }
}

export default new CombatSystem();
