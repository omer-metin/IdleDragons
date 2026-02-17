const CrazyGamesSDK = {
    sdk: null,
    isInitialized: false,

    async init() {
        if (this.isInitialized) return;

        // Check if window.CrazyGames.SDK is available
        // The V3 SDK script creates window.CrazyGames.SDK
        try {
            if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) {
                await window.CrazyGames.SDK.init();
                this.sdk = window.CrazyGames.SDK;
                this.isInitialized = true;
                console.log('CrazyGames SDK Initialized');
            } else {
                throw new Error('SDK not available');
            }
        } catch (e) {
            console.warn('CrazyGames SDK not found (Dev Mode or Loading?)');

            // Mock for Event if in Dev environment (or if SDK failed to load)
            // We assume it's dev mode if SDK is missing after page load
            this.sdk = {
                game: {
                    gameplayStart: () => console.log('Mock SDK: Gameplay Start'),
                    gameplayStop: () => console.log('Mock SDK: Gameplay Stop'),
                    loadingStart: () => console.log('Mock SDK: Loading Start'),
                    loadingStop: () => console.log('Mock SDK: Loading Stop'),
                },
                ad: {
                    requestAd: (type, callbacks) => {
                        console.log(`Mock SDK: Requesting ${type} ad`);
                        if (callbacks.adFinished) callbacks.adFinished();
                    }
                }
            };
            this.isInitialized = true;
        }
    },

    ensureInit() {
        // Retry init if called and not ready (e.g. if script loaded late)
        if (!this.isInitialized || (this.sdk && this.sdk.game && this.sdk.game.gameplayStart.toString().includes('Mock'))) {
            if (window.CrazyGames && window.CrazyGames.SDK) {
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

    async showRewardedAd(onReward, onError) {
        this.ensureInit();

        try {
            if (!this.sdk || !this.sdk.ad) {
                throw new Error("SDK Ad module missing");
            }

            await this.sdk.ad.requestAd('rewarded', {
                adStarted: () => {
                    this.gameplayStop();
                    // Mute audio if needed
                },
                adFinished: () => {
                    this.gameplayStart();
                    if (onReward) onReward();
                },
                adError: (error) => {
                    this.gameplayStart();
                    console.error('Ad Error', error);
                    if (onError) onError(error);
                }
            });
        } catch (e) {
            console.error('Ad Exception', e);
            // In dev mode (mock), we should have handled it above in mock ad object
            // But if real SDK failed:
            if (onError) onError(e);
        }
    }
};

export default CrazyGamesSDK;
