import { create } from 'zustand';

const useTutorialStore = create((set, get) => ({
    // Tutorial state
    currentStep: 0,
    isActive: false,
    isCompleted: false,
    isSkipped: false,

    // Step definitions
    steps: [
        {
            id: 'welcome',
            title: 'Welcome, Game Master!',
            text: 'You are the Dungeon Master. Recruit heroes, form a party, and send them into battle against endless waves of monsters. When they fall, their souls fuel your next generation.',
            position: 'center',
            highlight: null,
            gameState: 'LOBBY',
            icon: '🐉',
        },
        {
            id: 'recruit',
            title: 'Recruit Your First Hero',
            text: 'Click on an empty slot on the grid below to recruit a hero. Each hero costs Souls — the currency of the dead.',
            position: 'top',
            highlight: 'grid',
            gameState: 'LOBBY',
            icon: '⚔️',
            waitForAction: 'recruitment_opened',
        },
        {
            id: 'party_ready',
            title: 'Your Hero Awaits!',
            text: 'Excellent! You can recruit more heroes by clicking other empty slots, or manage your party. When you\'re ready, start the adventure!',
            position: 'top',
            highlight: null,
            gameState: 'LOBBY',
            icon: '🛡️',
            requiresParty: true,
        },
        {
            id: 'start_adventure',
            title: 'Begin the Adventure!',
            text: 'Press START ADVENTURE to send your party into battle. They will fight automatically — your job is to manage upgrades and strategy between runs.',
            position: 'top',
            highlight: 'start_button',
            gameState: 'LOBBY',
            icon: '🏰',
            requiresParty: true,
        },
        {
            id: 'tpk_explain',
            title: 'The Power of TPK',
            text: 'When your last hero falls, you earn Souls based on how far you got. Use Souls to recruit stronger heroes and buy permanent upgrades. Each reset makes you more powerful!',
            position: 'center',
            highlight: null,
            gameState: 'GAMEOVER',
            icon: '💀',
        },
    ],

    // Start tutorial (only if not completed and conditions met)
    startTutorial: () => {
        const { isCompleted, isSkipped } = get();
        if (isCompleted || isSkipped) return;
        set({ isActive: true, currentStep: 0 });
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
    // Called from game state changes
    checkStepTrigger: (gameState, partySize) => {
        const { isActive, currentStep, steps, isCompleted, isSkipped } = get();
        if (isCompleted || isSkipped) return;
        if (!isActive) return;

        const step = steps[currentStep];
        if (!step) return;

        // Auto-advance for party_ready step when a hero is recruited
        if (step.id === 'recruit' && partySize > 0) {
            set({ currentStep: currentStep + 1 });
        }

        // Trigger TPK explanation when game over happens
        if (step.id === 'tpk_explain' && gameState !== 'GAMEOVER') {
            // Not ready yet, skip for now
            return;
        }
    },

    // Called when recruitment panel opens (step 1 waitForAction)
    onRecruitmentOpened: () => {
        const { isActive, currentStep, steps } = get();
        if (!isActive) return;
        const step = steps[currentStep];
        if (step && step.id === 'recruit') {
            // Don't advance yet — wait for actual recruitment
        }
    },

    // Called when a hero is recruited
    onHeroRecruited: () => {
        const { isActive, currentStep, steps } = get();
        if (!isActive) return;
        const step = steps[currentStep];
        if (step && step.id === 'recruit') {
            set({ currentStep: currentStep + 1 }); // Move to party_ready
        }
    },

    // Called when adventure starts
    onAdventureStarted: () => {
        const { isActive, currentStep, steps } = get();
        if (!isActive) return;
        const step = steps[currentStep];
        if (step && step.id === 'start_adventure') {
            // Skip to TPK step — it will wait for GAMEOVER
            set({ currentStep: currentStep + 1 });
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
            // It will show naturally since gameState matches
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
