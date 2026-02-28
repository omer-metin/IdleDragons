import { describe, it, expect, beforeEach, vi } from 'vitest';
import useEventStore from '../src/store/useEventStore';

// Mock dependencies
vi.mock('../src/store/useResourceStore', () => ({
    default: {
        getState: () => ({
            gold: 500,
            addGold: vi.fn(),
        }),
    }
}));

vi.mock('../src/store/useGameStore', () => ({
    default: {
        getState: () => ({ zone: 5 }),
        setState: vi.fn(),
    }
}));

vi.mock('../src/store/usePartyStore', () => ({
    default: {
        getState: () => ({ members: [] }),
        setState: vi.fn(),
    }
}));

vi.mock('../src/store/useLootStore', () => ({
    default: {
        getState: () => ({
            rollEliteLoot: () => ({ name: 'Test Sword', rarityColor: '#fff' }),
        }),
    }
}));

vi.mock('../src/store/useToastStore', () => ({
    default: {
        getState: () => ({ addToast: vi.fn() }),
    }
}));

vi.mock('../src/audio/AudioManager', () => ({
    default: { playSFX: vi.fn() }
}));

describe('useEventStore', () => {
    beforeEach(() => {
        useEventStore.setState({
            activeEvent: null,
            activeBuffs: { atkMult: 1, defMult: 1 },
            eventsCompleted: 0,
            lastEventType: null,
        });
    });

    it('has correct initial state', () => {
        const state = useEventStore.getState();
        expect(state.activeEvent).toBeNull();
        expect(state.activeBuffs.atkMult).toBe(1);
        expect(state.activeBuffs.defMult).toBe(1);
        expect(state.eventsCompleted).toBe(0);
    });

    it('rollEvent may return an event or null', () => {
        // Run many times since it's RNG-based (40% chance)
        let gotEvent = false;
        let gotNull = false;
        for (let i = 0; i < 100; i++) {
            useEventStore.setState({ activeEvent: null });
            const result = useEventStore.getState().rollEvent();
            if (result) gotEvent = true;
            else gotNull = true;
        }
        expect(gotEvent).toBe(true);
        expect(gotNull).toBe(true);
    });

    it('rolled event has expected shape', () => {
        let event = null;
        for (let i = 0; i < 100 && !event; i++) {
            useEventStore.setState({ activeEvent: null });
            event = useEventStore.getState().rollEvent();
        }
        expect(event).toBeDefined();
        expect(event.title).toBeDefined();
        expect(event.options).toBeDefined();
        expect(event.options.length).toBeGreaterThan(0);
    });

    it('resolveEvent with skip clears event and increments counter', () => {
        // Set up a known event
        useEventStore.setState({
            activeEvent: {
                type: 'campfire',
                title: 'Campfire',
                icon: '🔥',
                options: [{ label: 'Rest', action: 'heal' }],
            }
        });

        useEventStore.getState().resolveEvent(0);
        expect(useEventStore.getState().activeEvent).toBeNull();
        expect(useEventStore.getState().eventsCompleted).toBe(1);
    });

    it('clearBuffs resets multipliers to 1', () => {
        useEventStore.setState({ activeBuffs: { atkMult: 1.3, defMult: 0.8 } });
        useEventStore.getState().clearBuffs();
        expect(useEventStore.getState().activeBuffs).toEqual({ atkMult: 1, defMult: 1 });
    });

    it('reset clears event and buffs', () => {
        useEventStore.setState({
            activeEvent: { type: 'test' },
            activeBuffs: { atkMult: 1.3, defMult: 0.8 },
        });
        useEventStore.getState().reset();
        expect(useEventStore.getState().activeEvent).toBeNull();
        expect(useEventStore.getState().activeBuffs).toEqual({ atkMult: 1, defMult: 1 });
    });

    describe('save/load', () => {
        it('saves and restores event state', () => {
            useEventStore.setState({
                eventsCompleted: 5,
                lastEventType: 'merchant',
                activeBuffs: { atkMult: 1.3, defMult: 0.8 },
            });

            const data = useEventStore.getState().getSaveData();
            useEventStore.setState({ eventsCompleted: 0, lastEventType: null, activeBuffs: { atkMult: 1, defMult: 1 } });
            useEventStore.getState().loadSaveData(data);

            expect(useEventStore.getState().eventsCompleted).toBe(5);
            expect(useEventStore.getState().lastEventType).toBe('merchant');
            expect(useEventStore.getState().activeBuffs.atkMult).toBe(1.3);
        });
    });
});
