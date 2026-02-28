/**
 * CloudStorage — abstraction over CrazyGames SDK data module.
 * Uses SDK.data if available (cloud sync for logged-in users),
 * falls back to localStorage for dev/guest.
 *
 * API mirrors localStorage: setItem, getItem, removeItem, clear.
 */

const MIGRATION_KEY = 'idlesndragons_cloud_migrated';

const CloudStorage = {
    _sdkData: null,
    _initialized: false,

    /**
     * Initialize — call after CrazyGames SDK init.
     * Detects SDK data module and migrates existing localStorage saves.
     */
    init() {
        if (this._initialized) return;

        try {
            if (typeof window !== 'undefined' &&
                window.CrazyGames &&
                window.CrazyGames.SDK &&
                window.CrazyGames.SDK.data) {
                this._sdkData = window.CrazyGames.SDK.data;
                console.log('CloudStorage: Using CrazyGames SDK data module');

                // Migrate existing localStorage saves on first SDK use
                this._migrateFromLocalStorage();
            } else {
                console.log('CloudStorage: Falling back to localStorage');
            }
        } catch (e) {
            console.warn('CloudStorage: Init error, using localStorage', e);
        }

        this._initialized = true;
    },

    /**
     * Copy existing localStorage save to SDK data module (one-time).
     * Preserves existing player data when cloud save is first enabled.
     */
    _migrateFromLocalStorage() {
        try {
            if (!this._sdkData) return;

            // Check if already migrated
            const migrated = localStorage.getItem(MIGRATION_KEY);
            if (migrated) return;

            // Copy the save key
            const saveKey = 'idlesndragons_save';
            const existingData = localStorage.getItem(saveKey);
            if (existingData) {
                // Only migrate if SDK data doesn't already have a save
                const cloudData = this._sdkData.getItem(saveKey);
                if (!cloudData) {
                    this._sdkData.setItem(saveKey, existingData);
                    console.log('CloudStorage: Migrated localStorage save to cloud');
                } else {
                    console.log('CloudStorage: Cloud save already exists, skipping migration');
                }
            }

            localStorage.setItem(MIGRATION_KEY, 'true');
        } catch (e) {
            console.warn('CloudStorage: Migration error', e);
        }
    },

    setItem(key, value) {
        // Always write to both for redundancy
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('CloudStorage: localStorage.setItem failed', e);
        }

        if (this._sdkData) {
            try {
                this._sdkData.setItem(key, value);
            } catch (e) {
                console.warn('CloudStorage: SDK data.setItem failed', e);
            }
        }
    },

    getItem(key) {
        // Prefer SDK data (cloud) over localStorage
        if (this._sdkData) {
            try {
                const value = this._sdkData.getItem(key);
                if (value !== null) return value;
            } catch (e) {
                console.warn('CloudStorage: SDK data.getItem failed', e);
            }
        }

        // Fallback to localStorage
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('CloudStorage: localStorage.getItem failed', e);
            return null;
        }
    },

    removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('CloudStorage: localStorage.removeItem failed', e);
        }

        if (this._sdkData) {
            try {
                this._sdkData.removeItem(key);
            } catch (e) {
                console.warn('CloudStorage: SDK data.removeItem failed', e);
            }
        }
    },

    clear() {
        try {
            localStorage.removeItem('idlesndragons_save');
        } catch (e) {
            console.warn('CloudStorage: localStorage clear failed', e);
        }

        if (this._sdkData) {
            try {
                this._sdkData.removeItem('idlesndragons_save');
            } catch (e) {
                console.warn('CloudStorage: SDK data clear failed', e);
            }
        }
    },
};

export default CloudStorage;
