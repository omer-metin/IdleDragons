/**
 * SkillSystem — Auto-cast class skills with cooldowns.
 * Each hero class has one signature skill that fires automatically when ready.
 * Skills are idle-game friendly: no manual activation needed.
 */

import * as PIXI from 'pixi.js';
import CombatSystem from './CombatSystem';
import ParticleSystem from './ParticleSystem';
import AudioManager from '../../audio/AudioManager';

/** Skill definitions per class. Cooldowns in frames (60fps). */
export const SKILL_DEFS = {
    Warrior: {
        name: 'Shield Bash',
        icon: 'W',
        cooldown: 900,   // 15s
        color: '#e74c3c',
        execute(hero, scene) {
            const target = CombatSystem.getNearestEnemy(hero);
            if (!target || target.hp <= 0) return false;

            // Stun nearest enemy for 2s (120 frames)
            target.stunTimer = 120;
            CombatSystem.dealDamage(hero, target, Math.floor(hero.atk * 0.5));
            ParticleSystem.emitHit(target.x, target.y - 20, 0xe74c3c);
            AudioManager.playSFX('hit_melee');
            showSkillText(scene, target, 'STUNNED!', '#e74c3c');
            return true;
        },
    },
    Mage: {
        name: 'Fireball',
        icon: 'M',
        cooldown: 1200,  // 20s
        color: '#e67e22',
        execute(hero, scene) {
            const enemies = getAliveEnemies(scene);
            if (enemies.length === 0) return false;

            // AoE: ATK*2 to all enemies
            const dmg = Math.floor(hero.atk * 2);
            for (const enemy of enemies) {
                CombatSystem.dealDamage(hero, enemy, dmg);
                ParticleSystem.spawn({
                    x: enemy.x, y: enemy.y - 20,
                    count: 6, color: 0xe67e22, speed: 3,
                    life: 25, scale: 1.2, spread: Math.PI * 2, friction: 0.08,
                });
            }
            AudioManager.playSFX('hit_magic');
            showSkillText(scene, hero, 'FIREBALL!', '#e67e22');
            return true;
        },
    },
    Archer: {
        name: 'Volley',
        icon: 'A',
        cooldown: 720,   // 12s
        color: '#27ae60',
        execute(hero, scene) {
            const enemies = getAliveEnemies(scene);
            if (enemies.length === 0) return false;

            // Hit 3 random enemies for ATK*0.8
            const dmg = Math.floor(hero.atk * 0.8);
            const targets = shuffleArray(enemies).slice(0, 3);
            for (const enemy of targets) {
                CombatSystem.dealDamage(hero, enemy, dmg);
                ParticleSystem.emitHit(enemy.x, enemy.y - 20, 0x27ae60);
            }
            AudioManager.playSFX('hit_arrow');
            showSkillText(scene, hero, 'VOLLEY!', '#27ae60');
            return true;
        },
    },
    Cleric: {
        name: 'Mass Heal',
        icon: 'C',
        cooldown: 1500,  // 25s
        color: '#2ecc71',
        execute(hero, scene) {
            const heroes = getAliveHeroes(scene);
            if (heroes.length === 0) return false;

            // Heal all allies ATK*0.4
            const healAmt = Math.max(3, Math.floor(hero.atk * 0.4));
            let healed = false;
            for (const h of heroes) {
                const maxHp = h.data.stats?.hp || 100;
                const currentHp = h.data.currentHp ?? maxHp;
                if (currentHp < maxHp) {
                    h.receiveHeal(healAmt);
                    CombatSystem.showHealText(h, healAmt);
                    healed = true;
                }
            }
            if (!healed) return false;
            ParticleSystem.spawn({
                x: hero.x, y: hero.y - 30,
                count: 15, color: 0x2ecc71, speed: 2,
                life: 40, scale: 1, spread: Math.PI * 2, friction: 0.05,
            });
            AudioManager.playSFX('heal');
            showSkillText(scene, hero, 'MASS HEAL!', '#2ecc71');
            return true;
        },
    },
    Rogue: {
        name: 'Assassinate',
        icon: 'R',
        cooldown: 1080,  // 18s
        color: '#9b59b6',
        execute(hero, scene) {
            const enemies = getAliveEnemies(scene);
            if (enemies.length === 0) return false;

            // ATK*4 to lowest HP enemy
            const target = enemies.reduce((low, e) => (e.hp < low.hp ? e : low), enemies[0]);
            const dmg = Math.floor(hero.atk * 4);
            CombatSystem.dealDamage(hero, target, dmg);
            ParticleSystem.spawn({
                x: target.x, y: target.y - 20,
                count: 10, color: 0x9b59b6, speed: 4,
                life: 30, scale: 1.5, spread: Math.PI * 2, friction: 0.06,
            });
            AudioManager.playSFX('hit_melee');
            showSkillText(scene, target, 'ASSASSINATE!', '#9b59b6');
            return true;
        },
    },
    Paladin: {
        name: 'Divine Shield',
        icon: 'P',
        cooldown: 1800,  // 30s
        color: '#ecf0f1',
        execute(hero, scene) {
            const heroes = getAliveHeroes(scene);
            if (heroes.length === 0) return false;

            // Party takes 50% damage for 5s (300 frames)
            for (const h of heroes) {
                h.divineShieldTimer = 300;
            }
            ParticleSystem.spawn({
                x: hero.x, y: hero.y - 30,
                count: 20, color: 0xf1c40f, speed: 3,
                life: 50, scale: 1.5, spread: Math.PI * 2, friction: 0.03,
                shape: 'rect',
            });
            AudioManager.playSFX('heal');
            showSkillText(scene, hero, 'DIVINE SHIELD!', '#f1c40f');
            return true;
        },
    },
};

/** Helpers */
function getAliveEnemies(scene) {
    if (!scene) return [];
    return Array.from(scene.enemyMap.values()).filter(e => e.hp > 0);
}

function getAliveHeroes(scene) {
    if (!scene) return [];
    return Array.from(scene.characterMap.values()).filter(h => !h.isDead && !h.isSleeping);
}

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Show floating skill name text over the target. */
function showSkillText(scene, target, text, color) {
    if (!scene || !scene.app) return;

    const style = new PIXI.TextStyle({
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fontWeight: 'bold',
        fill: color,
        stroke: '#000000',
        strokeThickness: 3,
    });
    const txt = new PIXI.Text(text, style);
    txt.x = target.x;
    txt.y = target.y - 60;
    txt.anchor.set(0.5);
    scene.vfxContainer.addChild(txt);

    let elapsed = 0;
    const duration = 60;
    const tick = (delta) => {
        elapsed += delta;
        txt.y -= 0.8 * delta;
        txt.alpha = 1 - (elapsed / duration);
        if (elapsed >= duration) {
            scene.app.ticker.remove(tick);
            scene.vfxContainer.removeChild(txt);
            txt.destroy();
        }
    };
    scene.app.ticker.add(tick);
}

export default SKILL_DEFS;
