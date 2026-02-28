import { describe, it, expect, beforeEach, vi } from 'vitest';
import useTutorialStore from '../src/store/useTutorialStore';

// Mock analytics store
vi.mock('../src/store/useAnalyticsStore', () => ({
    default: {
        getState: () => ({
            trackTutorialComplete: () => {},
            trackTutorialStep: () => {},
            trackTutorialSkip: () => {},
        }),
    }
}));

describe('useTutorialStore', () => {
    beforeEach(() => {
        useTutorialStore.setState({
            currentStep: 0,
            isActive: false,
            isCompleted: false,
            isSkipped: false,
        });
    });

    it('starts tutorial when not completed', () => {
        useTutorialStore.getState().startTutorial();
        expect(useTutorialStore.getState().isActive).toBe(true);
        expect(useTutorialStore.getState().currentStep).toBe(0);
    });

    it('does not start tutorial if already completed', () => {
        useTutorialStore.setState({ isCompleted: true });
        useTutorialStore.getState().startTutorial();
        expect(useTutorialStore.getState().isActive).toBe(false);
    });

    it('does not start tutorial if skipped', () => {
        useTutorialStore.setState({ isSkipped: true });
        useTutorialStore.getState().startTutorial();
        expect(useTutorialStore.getState().isActive).toBe(false);
    });

    it('advances to next step', () => {
        useTutorialStore.getState().startTutorial();
        useTutorialStore.getState().nextStep();
        expect(useTutorialStore.getState().currentStep).toBe(1);
    });

    it('completes tutorial after last step', () => {
        const totalSteps = useTutorialStore.getState().steps.length;
        useTutorialStore.setState({ isActive: true, currentStep: totalSteps - 1 });
        useTutorialStore.getState().nextStep();
        expect(useTutorialStore.getState().isActive).toBe(false);
        expect(useTutorialStore.getState().isCompleted).toBe(true);
    });

    it('skips tutorial', () => {
        useTutorialStore.getState().startTutorial();
        useTutorialStore.getState().skipTutorial();
        expect(useTutorialStore.getState().isActive).toBe(false);
        expect(useTutorialStore.getState().isSkipped).toBe(true);
        expect(useTutorialStore.getState().isCompleted).toBe(true);
    });

    it('restarts tutorial from settings', () => {
        useTutorialStore.setState({ isCompleted: true, isSkipped: true });
        useTutorialStore.getState().restartTutorial();
        expect(useTutorialStore.getState().isActive).toBe(true);
        expect(useTutorialStore.getState().isCompleted).toBe(false);
        expect(useTutorialStore.getState().currentStep).toBe(0);
    });

    it('getCurrentStep returns current step data when active', () => {
        useTutorialStore.getState().startTutorial();
        const step = useTutorialStore.getState().getCurrentStep();
        expect(step).not.toBeNull();
        expect(step.id).toBe('welcome');
    });

    it('getCurrentStep returns null when inactive', () => {
        expect(useTutorialStore.getState().getCurrentStep()).toBeNull();
    });

    describe('action callbacks', () => {
        it('onRecruitmentOpened advances from recruit step', () => {
            useTutorialStore.setState({ isActive: true, currentStep: 1 }); // step 1 = 'recruit'
            useTutorialStore.getState().onRecruitmentOpened();
            expect(useTutorialStore.getState().currentStep).toBe(2);
        });

        it('onAdventureStarted advances from party_ready step', () => {
            useTutorialStore.setState({ isActive: true, currentStep: 2 }); // step 2 = 'party_ready'
            useTutorialStore.getState().onAdventureStarted();
            expect(useTutorialStore.getState().currentStep).toBe(3);
        });

        it('onItemEquipped advances from equipment_tip step', () => {
            useTutorialStore.setState({ isActive: true, currentStep: 3 }); // step 3 = 'equipment_tip'
            useTutorialStore.getState().onItemEquipped();
            expect(useTutorialStore.getState().currentStep).toBe(4);
        });

        it('onItemSold advances from selling_tip step', () => {
            useTutorialStore.setState({ isActive: true, currentStep: 4 }); // step 4 = 'selling_tip'
            useTutorialStore.getState().onItemSold();
            expect(useTutorialStore.getState().currentStep).toBe(5);
        });
    });

    describe('save/load', () => {
        it('saves and restores tutorial state', () => {
            useTutorialStore.setState({ isCompleted: true, isSkipped: false, currentStep: 3, isActive: false });
            const data = useTutorialStore.getState().getSaveData();

            useTutorialStore.setState({ isCompleted: false, currentStep: 0 });
            useTutorialStore.getState().loadSaveData(data);

            expect(useTutorialStore.getState().isCompleted).toBe(true);
            expect(useTutorialStore.getState().currentStep).toBe(3);
        });
    });
});
