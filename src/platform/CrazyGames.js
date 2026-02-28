import AudioManager from '../audio/AudioManager';
import CloudStorage from './CloudStorage';

const INTERSTITIAL_MIN_GAP = 180000; // 3 minutes in ms

const CrazyGamesSDK = {
    sdk: null,
    isInitialized: false,
    lastInterstitialTime: 0,

    async init() {
        if (this.isInitialized) return;

        // Check if window.CrazyGames.SDK is available
        // The V3 SDK script creates window.CrazyGames.SDK
        try {
            if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) {
                await window.CrazyGames.SDK.init();
                this.sdk = window.CrazyGames.SDK;
                this.isInitialized = true;
                CloudStorage.init();
                console.log('CrazyGames SDK Initialized');
            } else {
                throw new Error('SDK not available');
            }
        } catch (e) {
            console.warn('CrazyGames SDK not found (Dev Mode or Loading?)');

            // Mock for Dev environment (or if SDK failed to load)
            this.sdk = {
                game: {
                    gameplayStart: () => console.log('Mock SDK: Gameplay Start'),
                    gameplayStop: () => console.log('Mock SDK: Gameplay Stop'),
                    loadingStart: () => console.log('Mock SDK: Loading Start'),
                    loadingStop: () => console.log('Mock SDK: Loading Stop'),
                    happytime: () => console.log('Mock SDK: Happytime'),
                },
                ad: {
                    requestAd: (type, callbacks) => {
                        console.log(`Mock SDK: Requesting ${type} ad`);
                        if (callbacks.adFinished) callbacks.adFinished();
                    }
                }
            };
            this.isInitialized = true;
            CloudStorage.init();
        }
    },

    ensureInit() {
        // Retry init if called and not ready (e.g. if script loaded late)
        if (!this.isInitialized || (this.sdk && this.sdk.game && this.sdk.game.gameplayStart.toString().includes('Mock'))) {
            if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) {
                this.sdk = window.CrazyGames.SDK;
                this.isInitialized = true;
                console.log('CrazyGames SDK Layout Late Initialized');
            }
        }
    },

    gameplayStart() {
        this.ensureInit();
        try {
            this.sdk?.game?.gameplayStart();
        } catch (e) {
            console.warn('SDK Start Error', e);
        }
    },

    gameplayStop() {
        this.ensureInit();
        try {
            this.sdk?.game?.gameplayStop();
        } catch (e) {
            console.warn('SDK Stop Error', e);
        }
    },

    loadingStart() {
        try {
            this.sdk?.game?.loadingStart();
        } catch (e) {
            console.warn('SDK Loading Start Error', e);
        }
    },

    loadingStop() {
        try {
            this.sdk?.game?.loadingStop();
        } catch (e) {
            console.warn('SDK Loading Stop Error', e);
        }
    },

    happytime() {
        this.ensureInit();
        try {
            this.sdk?.game?.happytime?.();
        } catch (e) {
            console.warn('SDK Happytime Error', e);
        }
    },

    async showRewardedAd(onReward, onError) {
        this.ensureInit();

        try {
            if (!this.sdk || !this.sdk.ad) {
                throw new Error("SDK Ad module missing");
            }

            await this.sdk.ad.requestAd('rewarded', {
                adStarted: () => {
                    this.gameplayStop();
                    AudioManager.mute();
                },
                adFinished: () => {
                    AudioManager.unmute();
                    this.gameplayStart();
                    if (onReward) onReward();
                },
                adError: (error) => {
                    AudioManager.unmute();
                    this.gameplayStart();
                    console.error('Ad Error', error);
                    if (onError) onError(error);
                }
            });
        } catch (e) {
            console.error('Ad Exception', e);
            if (onError) onError(e);
        }
    },

    async submitScore(score) {
        this.ensureInit();
        try {
            if (this.sdk?.game?.leaderboard) {
                await this.sdk.game.leaderboard.submitScore(score);
            } else {
                console.log(`Mock SDK: Submit score ${score}`);
            }
        } catch (e) {
            console.warn('SDK Leaderboard Submit Error', e);
        }
    },

    async getLeaderboard() {
        this.ensureInit();
        try {
            if (this.sdk?.game?.leaderboard) {
                return await this.sdk.game.leaderboard.getScores();
            }
        } catch (e) {
            console.warn('SDK Leaderboard Get Error', e);
        }
        return null;
    },

    async showInterstitialAd(callbacks) {
        this.ensureInit();

        // Enforce minimum gap between interstitials
        const now = Date.now();
        if (now - this.lastInterstitialTime < INTERSTITIAL_MIN_GAP) {
            console.log('Interstitial skipped: too soon');
            return;
        }
        this.lastInterstitialTime = now;

        try {
            if (!this.sdk || !this.sdk.ad) {
                // In mock mode, just log
                console.log('Mock Interstitial Ad Shown');
                this.gameplayStop();
                AudioManager.mute();
                setTimeout(() => {
                    AudioManager.unmute();
                    this.gameplayStart();
                    if (callbacks && callbacks.adFinished) callbacks.adFinished();
                }, 1000);
                return;
            }

            await this.sdk.ad.requestAd('midgame', {
                adStarted: () => {
                    this.gameplayStop();
                    AudioManager.mute();
                    if (callbacks && callbacks.adStarted) callbacks.adStarted();
                },
                adFinished: () => {
                    AudioManager.unmute();
                    this.gameplayStart();
                    if (callbacks && callbacks.adFinished) callbacks.adFinished();
                },
                adError: (error) => {
                    AudioManager.unmute();
                    this.gameplayStart();
                    console.error('Ad Error', error);
                    if (callbacks && callbacks.adError) callbacks.adError(error);
                }
            });
        } catch (e) {
            console.error('Ad Exception', e);
            if (callbacks && callbacks.adError) callbacks.adError(e);
        }
    }
};

export default CrazyGamesSDK;
