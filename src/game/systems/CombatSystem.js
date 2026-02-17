import * as PIXI from 'pixi.js';
import usePartyStore from '../../store/usePartyStore';
import AudioManager from '../../audio/AudioManager';
import ParticleSystem from './ParticleSystem';

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
        ParticleSystem.emitHit(target.x, target.y - 20);
    }

    showDeathEffect(target) {
        const color = target.isBoss ? 0xf1c40f : 0x8e44ad;
        ParticleSystem.emitExplosion(target.x, target.y - 20, color);
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

    // Find lowest HP enemy (for Healer enemies)
    getLowestHpEnemy(healer) {
        if (!this.scene) return null;
        let lowestTarget = null;
        let lowestRatio = 1;

        for (const enemy of this.scene.enemyMap.values()) {
            if (enemy.hp <= 0) continue;
            if (enemy.id === healer.id) continue;

            const ratio = enemy.hp / enemy.maxHp;
            if (ratio < lowestRatio) {
                lowestRatio = ratio;
                lowestTarget = enemy;
            }
        }

        // Self-heal
        if (!lowestTarget) {
            if (healer.hp < healer.maxHp) return healer;
        }

        return lowestTarget;
    }

    healEnemy(healer, target, amount) {
        target.receiveHeal(amount);
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
