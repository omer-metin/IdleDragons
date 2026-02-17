import { create } from 'zustand';

const useToastStore = create((set, get) => ({
    toasts: [],

    addToast: ({ type, message, icon, color, duration = 3000 }) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = {
            id,
            type,
            message,
            icon,
            color,
            timestamp: Date.now()
        };

        set((state) => ({
            toasts: [newToast, ...state.toasts].slice(0, 5) // Keep max 5 visible
        }));

        setTimeout(() => {
            get().removeToast(id);
        }, duration);
    },

    removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
    })),

    // Consolidated Gold Toast
    addGoldToast: (amount) => {
        const { toasts } = get();
        const now = Date.now();
        // Find recent gold toast (within 1.5s)
        const lastGold = toasts.find(t => t.type === 'gold' && (now - t.timestamp) < 1500);

        if (lastGold) {
            const currentAmount = parseInt(lastGold.rawAmount || 0);
            const newAmount = currentAmount + amount;

            set((state) => ({
                toasts: state.toasts.map(t => t.id === lastGold.id ? {
                    ...t,
                    message: `+${newAmount} Gold`,
                    rawAmount: newAmount,
                    // reset timer? If we do, it stays forever if constant stream. 
                    // Better to let it expire and spawn new one eventually.
                    // But we want it to stay while accumulating.
                    // Let's NOT reset timer, but maybe extend it slightly?
                } : t)
            }));
        } else {
            const id = Math.random().toString(36).substr(2, 9);
            const toast = {
                id,
                type: 'gold',
                message: `+${amount} Gold`,
                rawAmount: amount,
                icon: '🪙',
                color: '#f1c40f', // var(--accent-gold)
                timestamp: now
            };

            set((state) => ({ toasts: [toast, ...state.toasts].slice(0, 5) }));

            setTimeout(() => {
                get().removeToast(id);
            }, 2500); // Slightly shorter for resources
        }
    },

    // Consolidated XP Toast
    addXpToast: (amount) => {
        const { toasts } = get();
        const now = Date.now();
        const lastXp = toasts.find(t => t.type === 'xp' && (now - t.timestamp) < 1500);

        if (lastXp) {
            const currentAmount = parseInt(lastXp.rawAmount || 0);
            const newAmount = currentAmount + amount;

            set((state) => ({
                toasts: state.toasts.map(t => t.id === lastXp.id ? {
                    ...t,
                    message: `+${newAmount} XP`,
                    rawAmount: newAmount,
                } : t)
            }));
        } else {
            const id = Math.random().toString(36).substr(2, 9);
            const toast = {
                id,
                type: 'xp',
                message: `+${amount} XP`,
                rawAmount: amount,
                icon: '✨',
                color: '#3498db', // var(--accent-info)
                timestamp: now
            };

            set((state) => ({ toasts: [toast, ...state.toasts].slice(0, 5) }));

            setTimeout(() => {
                get().removeToast(id);
            }, 2500);
        }
    }
}));

export default useToastStore;
