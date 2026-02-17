import { create } from 'zustand';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// XP required to level up
const xpToLevel = (level) => Math.floor(50 * Math.pow(1.5, level - 1));

const usePartyStore = create((set, get) => ({
    // Grid State
    gridSize: { width: 3, height: 1 },
    members: [], // { id, x, y, characterId, stats, ... }

    addMember: (template, x, y) => {
        const { members, gridSize } = get();

        // If coordinates provided, validate them
        if (x !== undefined && y !== undefined) {
            if (x < 0 || x >= gridSize.width || y < 0 || y >= gridSize.height) return false;
            if (members.some(m => m.x === x && m.y === y)) return false;
        } else {
            // Find first available slot (Row-major: 0,0 -> 1,0 -> 2,0 -> 0,1...)
            let found = false;
            for (let j = 0; j < gridSize.height; j++) {
                for (let i = 0; i < gridSize.width; i++) {
                    if (!members.some(m => m.x === i && m.y === j)) {
                        x = i;
                        y = j;
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            if (!found) return false;
        }

        const newMember = {
            id: generateId(),
            ...template,
            level: template.level || 1,
            xp: 0,
            currentHp: template.stats.hp,
            x: x,
            y: y,
            equipment: { combinedStats: { atk: 0, def: 0, hp: 0 } },
        };

        set({ members: [...members, newMember] });
        return true;
    },

    equipItem: (memberId, slot, item) => {
        set((state) => ({
            members: state.members.map((m) => {
                if (m.id !== memberId) return m;

                const newEquipment = { ...m.equipment, [slot]: item };
                // Recalculate stats
                const stats = { atk: 0, def: 0, hp: 0 };
                Object.values(newEquipment).forEach(i => {
                    if (i && i.stats) {
                        stats.atk += (i.stats.atk || 0);
                        stats.def += (i.stats.def || 0);
                        stats.hp += (i.stats.hp || 0);
                    }
                });

                return { ...m, equipment: { ...newEquipment, combinedStats: stats } };
            })
        }));
    },

    moveMember: (id, targetX, targetY) => {
        const { members, gridSize } = get();

        if (targetX < 0 || targetX >= gridSize.width || targetY < 0 || targetY >= gridSize.height) return false;

        const targetMember = members.find(m => m.x === targetX && m.y === targetY);
        const sourceMember = members.find(m => m.id === id);

        if (!sourceMember) return false;

        set((state) => ({
            members: state.members.map((m) => {
                if (m.id === id) return { ...m, x: targetX, y: targetY };
                if (targetMember && m.id === targetMember.id) return { ...m, x: sourceMember.x, y: sourceMember.y };
                return m;
            })
        }));
        return true;
    },

    removeMember: (id) => {
        set((state) => ({
            members: state.members.filter((m) => m.id !== id),
        }));
    },

    updateMember: (id, updates) => {
        set((state) => ({
            members: state.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
    },

    // Grant XP to a specific member, auto-level if threshold met
    grantXp: (memberId, amount) => {
        set((state) => ({
            members: state.members.map((m) => {
                if (m.id !== memberId) return m;

                let newXp = (m.xp || 0) + amount;
                let level = m.level || 1;
                let stats = { ...m.stats };

                // Level up loop
                while (newXp >= xpToLevel(level)) {
                    newXp -= xpToLevel(level);
                    level += 1;

                    // Stat growth: 10% per level
                    stats = {
                        ...stats,
                        hp: Math.floor(stats.hp * 1.1),
                        atk: Math.floor(stats.atk * 1.1) || stats.atk + 1,
                        def: (stats.def || 0) + 1,
                    };
                }

                return {
                    ...m,
                    xp: newXp,
                    level,
                    stats,
                    currentHp: level > (m.level || 1) ? stats.hp : m.currentHp, // Full heal on level up
                };
            })
        }));
    },

    // Distribute XP evenly to all alive members
    distributeXp: (totalXp) => {
        const { members } = get();
        const aliveMembers = members.filter(m => (m.currentHp ?? m.stats.hp) > 0);
        if (aliveMembers.length === 0) return;

        const xpEach = Math.max(1, Math.floor(totalXp / aliveMembers.length));
        aliveMembers.forEach(m => {
            get().grantXp(m.id, xpEach);
        });
    },

    // Calculate total party DPS for idle earnings
    getDPS: () => {
        const { members } = get();
        return members.reduce((total, m) => {
            if ((m.currentHp ?? m.stats.hp) <= 0) return total; // Dead members don't contribute
            const equipAtk = m.equipment?.combinedStats?.atk || 0;
            const atk = (m.stats?.atk || 10) + equipAtk;
            return total + atk;
        }, 0);
    },

    reviveAll: () => {
        set((state) => ({
            members: state.members.map(m => ({
                ...m,
                currentHp: m.stats.hp + (m.equipment?.combinedStats?.hp || 0)
            }))
        }));
    },

    reset: () => set({ members: [] }),
}));

export default usePartyStore;
export { xpToLevel };
