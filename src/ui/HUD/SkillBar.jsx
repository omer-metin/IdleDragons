import React, { useEffect, useState } from 'react';
import usePartyStore from '../../store/usePartyStore';
import useGameStore from '../../store/useGameStore';
import CombatSystem from '../../game/systems/CombatSystem';
import { SKILL_DEFS } from '../../game/systems/SkillSystem';

const SKILL_ICONS = {
    Warrior: { emoji: '\u2694\uFE0F', label: 'Shield Bash' },
    Mage: { emoji: '\uD83D\uDD25', label: 'Fireball' },
    Archer: { emoji: '\uD83C\uDFF9', label: 'Volley' },
    Cleric: { emoji: '\u2728', label: 'Mass Heal' },
    Rogue: { emoji: '\uD83D\uDDE1\uFE0F', label: 'Assassinate' },
    Paladin: { emoji: '\uD83D\uDEE1\uFE0F', label: 'Divine Shield' },
};

const SkillBar = () => {
    const { members } = usePartyStore();
    const { isRunning } = useGameStore();
    const [skills, setSkills] = useState([]);

    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            const scene = CombatSystem.scene;
            if (!scene) return;

            const skillData = [];
            for (const member of members) {
                const char = scene.characterMap.get(member.id);
                if (!char || char.isDead || !char.skillDef) continue;

                const cd = Math.max(0, char.skillCooldown);
                const maxCd = char.skillMaxCooldown;
                const ratio = maxCd > 0 ? cd / maxCd : 0;

                skillData.push({
                    id: member.id,
                    name: member.name,
                    className: member.class,
                    skillName: char.skillDef.name,
                    cdRatio: ratio,
                    ready: cd <= 0,
                    color: char.skillDef.color,
                });
            }
            setSkills(skillData);
        }, 200); // Update 5x/sec

        return () => clearInterval(interval);
    }, [isRunning, members]);

    if (!isRunning || skills.length === 0) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '0.4rem',
            pointerEvents: 'none',
        }}>
            {skills.map(s => {
                const icon = SKILL_ICONS[s.className];
                return (
                    <div
                        key={s.id}
                        title={`${s.name}: ${s.skillName}`}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            background: s.ready ? s.color : '#1a1a2e',
                            border: `2px solid ${s.ready ? '#fff' : '#333'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: s.ready ? `0 0 10px ${s.color}` : 'none',
                            transition: 'all 0.2s',
                        }}
                    >
                        {/* Cooldown sweep overlay */}
                        {!s.ready && (
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '100%',
                                height: `${s.cdRatio * 100}%`,
                                background: 'rgba(0,0,0,0.6)',
                                transition: 'height 0.2s',
                            }} />
                        )}
                        <span style={{
                            fontSize: '1.2rem',
                            position: 'relative',
                            zIndex: 1,
                            filter: s.ready ? 'none' : 'grayscale(0.5)',
                        }}>
                            {icon?.emoji || '?'}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default SkillBar;
