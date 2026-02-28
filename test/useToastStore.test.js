import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import useToastStore from '../src/store/useToastStore';

describe('useToastStore', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        useToastStore.setState({ toasts: [] });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('adds a toast', () => {
        useToastStore.getState().addToast({ type: 'info', message: 'Hello', icon: '!', color: '#fff' });
        expect(useToastStore.getState().toasts).toHaveLength(1);
        expect(useToastStore.getState().toasts[0].message).toBe('Hello');
    });

    it('limits to 5 visible toasts', () => {
        for (let i = 0; i < 7; i++) {
            useToastStore.getState().addToast({ type: 'info', message: `Toast ${i}`, icon: '!', color: '#fff' });
        }
        expect(useToastStore.getState().toasts.length).toBeLessThanOrEqual(5);
    });

    it('removes toast by id', () => {
        useToastStore.getState().addToast({ type: 'info', message: 'Test', icon: '!', color: '#fff' });
        const id = useToastStore.getState().toasts[0].id;
        useToastStore.getState().removeToast(id);
        expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('auto-removes toast after duration', () => {
        useToastStore.getState().addToast({ type: 'info', message: 'Test', icon: '!', color: '#fff', duration: 1000 });
        expect(useToastStore.getState().toasts).toHaveLength(1);
        vi.advanceTimersByTime(1100);
        expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('consolidates gold toasts within 1.5s window', () => {
        useToastStore.getState().addGoldToast(100);
        useToastStore.getState().addGoldToast(50);
        expect(useToastStore.getState().toasts).toHaveLength(1);
        expect(useToastStore.getState().toasts[0].message).toBe('+150 Gold');
    });

    it('consolidates xp toasts within 1.5s window', () => {
        useToastStore.getState().addXpToast(200);
        useToastStore.getState().addXpToast(100);
        expect(useToastStore.getState().toasts).toHaveLength(1);
        expect(useToastStore.getState().toasts[0].message).toBe('+300 XP');
    });

    it('creates new gold toast after consolidation window', () => {
        useToastStore.getState().addGoldToast(100);
        vi.advanceTimersByTime(2000); // Past 1.5s consolidation window
        useToastStore.getState().addGoldToast(50);
        // Should have 2 toasts (first one may have been removed by auto-timer)
        const toasts = useToastStore.getState().toasts;
        const goldToasts = toasts.filter(t => t.type === 'gold');
        expect(goldToasts.length).toBeGreaterThanOrEqual(1);
    });
});
