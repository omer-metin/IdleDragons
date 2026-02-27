import { create } from 'zustand';

const useTutorialStore = create((set, get) => ({
    // Tutorial state
    currentStep: 0,
    isActive: false,
    isCompleted: false,
    isSkipped: false,

    // Step definitions — action-driven tutorial
    // Steps with waitForAction are non-blocking and advance when the player performs the action.
    // Steps without waitForAction show a "NEXT" button (informational tips).
    steps: [
        {
            id: 'welcome',
            title: 'Welcome, Game Master!',
            text: 'You are the Dungeon Master. Recruit heroes, form a party, and send them into battle against endless waves of monsters. When they fall, their souls fuel your next generation.',
            position: 'center',
            highlight: null,
            gameState: 'LOBBY',
            icon: '\uD83D\uDC09',
        },
        {
            id: 'recruit',
            title: 'Recruit Your First Hero',
            text: 'Click on an empty slot on the grid to recruit a hero. Each hero costs Souls \u2014 the currency of the dead.',
            position: 'top',
            highlight: 'grid',
            gameState: 'LOBBY',
            icon: '\u2694\uFE0F',
            waitForAction: true,
            actionHint: '\uD83D\uDC46 Click an empty grid slot to recruit',
        },
        {
            id: 'party_ready',
            title: 'Your Hero Awaits!',
            text: 'Great! You can recruit more heroes by clicking other empty slots. When you\'re ready, press START ADVENTURE!',
            position: 'top',
            highlight: 'start_button',
            gameState: 'LOBBY',
            icon: '\uD83D\uDEE1\uFE0F',
            waitForAction: true,
            actionHint: '\u25B6\uFE0F Press START ADVENTURE to begin',
        },
        {
            id: 'equipment_tip',
            title: 'Gear Up!',
            text: 'You found loot! Click a hero in the Warband panel, then equip items to boost their stats. Better gear means deeper zones!',
            position: 'top',
            highlight: null,
            gameState: 'RUNNING',
            icon: '\uD83D\uDEE1\uFE0F',
            waitForAction: true,
            actionHint: '\uD83D\uDC46 Click a hero to view and equip items',
        },
        {
            id: 'selling_tip',
            title: 'Manage Your Inventory',
            text: 'Your inventory is filling up! Sell unwanted items for gold, or salvage them for crafting materials. Use "Sell" for quick cleanup.',
            position: 'top',
            highlight: null,
            gameState: 'RUNNING',
            icon: '\uD83D\uDCB0',
            waitForAction: true,
            actionHint: '\uD83D\uDC46 Sell or salvage items from your inventory',
        },
        {
            id: 'crafting_tip',
            title: 'Craft Powerful Gear',
            text: 'Salvage items to get materials like Iron, Crystal, and Essence. Then visit the Crafting panel to forge guaranteed-rarity equipment!',
            position: 'center',
            highlight: null,
            gameState: 'RUNNING',
            icon: '\uD83D\uDD28',
        },
        {
            id: 'skills_tip',
            title: 'Hero Skills',
            text: 'Your heroes have unique skills that auto-cast during battle! Watch the skill bar for cooldown timers. Each class has a different powerful ability.',
            position: 'top',
            highlight: null,
            gameState: 'RUNNING',
            icon: '\u2728',
        },
        {
            id: 'prestige_tip',
            title: 'The Power of Prestige',
            text: 'Stuck on a tough zone? Use TPK to prestige! You\'ll earn Souls based on your progress. Spend them on permanent upgrades in the Soul Shop.',
            position: 'center',
            highlight: null,
            gameState: 'RUNNING',
            icon: '\uD83D\uDD04',
        },
        {
            id: 'tpk_explain',
            title: 'The Power of TPK',
            text: 'When your last hero falls, you earn Souls based on how far you got. Use Souls to recruit stronger heroes and buy permanent upgrades. Each reset makes you more powerful!',
            position: 'center',
            highlight: null,
            gameState: 'GAMEOVER',
            icon: '\uD83D\uDC80',
        },
    ],

    // Start tutorial (only if not completed and conditions met)
    startTutorial: () => {
        const { isCompleted, isSkipped } = get();
        if (isCompleted || isSkipped) return;
        set({ isActive: true, currentStep: 0 });
    },

    // Restart tutorial (from settings)
    restartTutorial: () => {
        set({ isCompleted: false, isSkipped: false, currentStep: 0, isActive: true });
    },

    // Advance to next step
    nextStep: () => {
        const { currentStep, steps } = get();
        const nextIndex = currentStep + 1;

        if (nextIndex >= steps.length) {
            set({ isActive: false, isCompleted: true, currentStep: 0 });
        } else {
            set({ currentStep: nextIndex });
        }
    },

    // Skip entire tutorial
    skipTutorial: () => {
        set({ isActive: false, isSkipped: true, isCompleted: true });
    },

    // Get current step data
    getCurrentStep: () => {
        const { currentStep, steps, isActive } = get();
        if (!isActive) return null;
        return steps[currentStep] || null;
    },

    // Check if a specific step should be triggered
    checkStepTrigger: (gameState, partySize) => {
        const { isActive, currentStep, steps, isCompleted, isSkipped } = get();
        if (isCompleted || isSkipped) return;
        if (!isActive) return;

        const step = steps[currentStep];
        if (!step) return;

        // Auto-advance for recruit step when a hero is recruited
        if (step.id === 'recruit' && partySize > 0) {
            set({ currentStep: currentStep + 1 });
        }
    },

    // ─── Action-driven callbacks ───────────────────────────

    // Called when recruitment panel opens (grid slot clicked)
    onRecruitmentOpened: () => {
        const { isActive, currentStep, steps } = get();
        if (!isActive) return;
        const step = steps[currentStep];
        if (step && step.id === 'recruit') {
            set({ currentStep: currentStep + 1 });
        }
    },

    // Called when a hero is recruited
    onHeroRecruited: () => {
        const { isActive, currentStep, steps } = get();
        if (!isActive) return;
        const step = steps[currentStep];
        if (step && step.id === 'recruit') {
            set({ currentStep: currentStep + 1 });
        }
    },

    // Called when adventure starts — advances past party_ready
    onAdventureStarted: () => {
        const { isActive, currentStep, steps } = get();
        if (!isActive) return;
        const step = steps[currentStep];
        if (step && (step.id === 'party_ready' || step.id === 'start_adventure')) {
            set({ currentStep: currentStep + 1 });
        }
    },

    // Called on first loot drop — shows equipment tip
    onFirstLoot: () => {
        const { isActive, currentStep, steps } = get();
        if (!isActive) return;
        const step = steps[currentStep];
        if (step && step.id === 'equipment_tip') {
            // Step is now visible — it matches RUNNING state
        }
    },

    // Called when player opens character details or equips an item
    onItemEquipped: () => {
        const { isActive, currentStep, steps } = get();
        if (!isActive) return;
        const step = steps[currentStep];
        if (step && step.id === 'equipment_tip') {
            set({ currentStep: currentStep + 1 });
        }
    },

    // Called when player sells or salvages an item
    onItemSold: () => {
        const { isActive, currentStep, steps } = get();
        if (!isActive) return;
        const step = steps[currentStep];
        if (step && step.id === 'selling_tip') {
            set({ currentStep: currentStep + 1 });
        }
    },

    // Called when inventory is near full (>= 40 items)
    onInventoryNearFull: () => {
        const { isActive, currentStep, steps } = get();
        if (!isActive) return;
        const step = steps[currentStep];
        // If still on equipment tip, advance to selling tip
        if (step && step.id === 'equipment_tip') {
            set({ currentStep: currentStep + 1 });
        }
    },

    // Called on first skill activation
    onFirstSkill: () => {
        const { isActive, currentStep, steps } = get();
        if (!isActive) return;
        const step = steps[currentStep];
        if (step && step.id === 'skills_tip') {
            // Step visible in RUNNING state
        }
    },

    // Called when prestige hint should show (zone 5+ or repeated wipes)
    onPrestigeHint: () => {
        const { isActive, currentStep, steps } = get();
        if (!isActive) return;
        const step = steps[currentStep];
        // Auto-skip intermediate steps to reach prestige_tip
        if (step && ['equipment_tip', 'selling_tip', 'crafting_tip', 'skills_tip'].includes(step.id)) {
            const prestigeIdx = steps.findIndex(s => s.id === 'prestige_tip');
            if (prestigeIdx >= 0) {
                set({ currentStep: prestigeIdx });
            }
        }
    },

    // Called on game over to show TPK tutorial
    onGameOver: () => {
        const { isActive, currentStep, steps, isCompleted, isSkipped } = get();
        if (isCompleted || isSkipped) return;
        if (!isActive) return;
        const step = steps[currentStep];
        if (step && step.id === 'tpk_explain') {
            // Step is now active and visible (GAMEOVER matches)
        }
    },

    // Serialization for save system
    getSaveData: () => {
        const { isCompleted, isSkipped, currentStep, isActive } = get();
        return { isCompleted, isSkipped, currentStep, isActive };
    },

    loadSaveData: (data) => {
        if (!data) return;
        set({
            isCompleted: data.isCompleted || false,
            isSkipped: data.isSkipped || false,
            currentStep: data.currentStep || 0,
            isActive: data.isActive || false,
        });
    },
}));

export default useTutorialStore;
