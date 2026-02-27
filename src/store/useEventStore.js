import { create } from 'zustand';
import useResourceStore from './useResourceStore';
import useGameStore from './useGameStore';
import usePartyStore from './usePartyStore';
import useLootStore from './useLootStore';
import useToastStore from './useToastStore';
import AudioManager from '../audio/AudioManager';

const EVENT_DEFS = {
    merchant: {
        title: 'Wandering Merchant',
        icon: '🧙',
        description: 'A hooded figure blocks the path, jingling a pouch of rare wares.',
        options: [
            { label: 'Buy Rare Item (200g)', action: 'buyItem' },
            { label: 'Buy Full Heal (100g)', action: 'heal' },
            { label: 'Leave', action: 'skip' },
        ],
    },
    shrine: {
        title: 'Mysterious Shrine',
        icon: '⛩️',
        description: 'An ancient shrine pulses with unstable energy. Touch it?',
        options: [
            { label: 'Touch it (+30% ATK, -20% DEF)', action: 'buffAtk' },
            { label: 'Pray (+30% DEF, -20% ATK)', action: 'buffDef' },
            { label: 'Walk away', action: 'skip' },
        ],
    },
    goblin: {
        title: 'Treasure Goblin',
        icon: '💰',
        description: 'A goblin carrying a sack of gold dashes past your party!',
        options: [
            { label: 'Chase it! (Bonus gold enemy)', action: 'chase' },
            { label: 'Ignore', action: 'skip' },
        ],
    },
    campfire: {
        title: 'Campfire',
        icon: '🔥',
        description: 'A warm fire crackles invitingly. Your heroes look weary.',
        options: [
            { label: 'Rest (Full Heal)', action: 'heal' },
        ],
    },
};

const EVENT_TYPES = Object.keys(EVENT_DEFS);

const useEventStore = create((set, get) => ({
    activeEvent: null,
    activeBuffs: { atkMult: 1, defMult: 1 },
    eventsCompleted: 0,
    lastEventType: null,

    rollEvent: () => {
        if (Math.random() > 0.40) return null; // 40% chance

        // Avoid repeating last event
        const candidates = EVENT_TYPES.filter(t => t !== get().lastEventType);
        const type = candidates[Math.floor(Math.random() * candidates.length)];
        const def = EVENT_DEFS[type];

        const event = { type, ...def };
        set({ activeEvent: event, lastEventType: type });
        return event;
    },

    resolveEvent: (optionIndex) => {
        const { activeEvent } = get();
        if (!activeEvent) return;

        const option = activeEvent.options[optionIndex];
        if (!option) return;

        const action = option.action;

        switch (action) {
            case 'buyItem': {
                const gold = useResourceStore.getState().gold;
                if (gold >= 200) {
                    useResourceStore.getState().addGold(-200);
                    const { zone } = useGameStore.getState();
                    const item = useLootStore.getState().rollEliteLoot(zone);
                    if (item) {
                        useToastStore.getState().addToast({ type: 'loot', message: `Bought: ${item.name}`, icon: '🧙', color: item.rarityColor, duration: 4000 });
                    }
                } else {
                    useToastStore.getState().addToast({ type: 'info', message: 'Not enough gold!', icon: '❌', color: '#e74c3c' });
                }
                break;
            }
            case 'heal': {
                const gold = useResourceStore.getState().gold;
                const isMerchant = activeEvent.type === 'merchant';
                if (isMerchant && gold < 100) {
                    useToastStore.getState().addToast({ type: 'info', message: 'Not enough gold!', icon: '❌', color: '#e74c3c' });
                    break;
                }
                if (isMerchant) useResourceStore.getState().addGold(-100);
                // Full heal all party members
                const members = usePartyStore.getState().members;
                members.forEach(m => {
                    if (m.stats) m.currentHp = m.stats.hp;
                });
                usePartyStore.setState({ members: [...members] });
                useToastStore.getState().addToast({ type: 'heal', message: 'Party fully healed!', icon: '💚', color: '#2ecc71' });
                AudioManager.playSFX('heal');
                break;
            }
            case 'buffAtk':
                set({ activeBuffs: { atkMult: 1.3, defMult: 0.8 } });
                useToastStore.getState().addToast({ type: 'buff', message: '+30% ATK, -20% DEF this zone', icon: '⚔️', color: '#e74c3c' });
                break;
            case 'buffDef':
                set({ activeBuffs: { atkMult: 0.8, defMult: 1.3 } });
                useToastStore.getState().addToast({ type: 'buff', message: '+30% DEF, -20% ATK this zone', icon: '🛡️', color: '#3498db' });
                break;
            case 'chase':
                // Treasure goblin: just give bonus gold based on zone
                const { zone: z } = useGameStore.getState();
                const bonusGold = z * 50;
                useResourceStore.getState().addGold(bonusGold);
                useToastStore.getState().addToast({ type: 'gold', message: `Caught the goblin! +${bonusGold}g`, icon: '💰', color: '#f1c40f', duration: 4000 });
                AudioManager.playSFX('loot_drop');
                break;
            case 'skip':
            default:
                break;
        }

        set((s) => ({ activeEvent: null, eventsCompleted: s.eventsCompleted + 1 }));
    },

    clearBuffs: () => set({ activeBuffs: { atkMult: 1, defMult: 1 } }),

    reset: () => set({ activeEvent: null, activeBuffs: { atkMult: 1, defMult: 1 } }),

    getSaveData: () => ({
        eventsCompleted: get().eventsCompleted,
        lastEventType: get().lastEventType,
        activeBuffs: get().activeBuffs,
    }),

    loadSaveData: (data) => {
        if (!data) return;
        set({
            eventsCompleted: data.eventsCompleted || 0,
            lastEventType: data.lastEventType || null,
            activeBuffs: data.activeBuffs || { atkMult: 1, defMult: 1 },
        });
    },
}));

export default useEventStore;
