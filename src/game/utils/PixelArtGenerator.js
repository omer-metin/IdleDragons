import * as PIXI from 'pixi.js';

class PixelArtGenerator {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Get a texture for a sprite matrix.
     * Supports both legacy flat arrays and new { idle, attack, death } frame objects.
     *
     * @param {string} key - Cache key
     * @param {string[]|object} matrixOrFrames - Flat string array or { idle, attack, death }
     * @param {object} palette - Character-to-color mapping
     * @param {string} [frame='idle'] - Which frame to render
     * @returns {PIXI.Texture}
     */
    getTexture(key, matrixOrFrames, palette = {}, frame = 'idle') {
        // Determine the actual matrix
        let matrix;
        if (Array.isArray(matrixOrFrames)) {
            // Legacy format: flat array of strings
            matrix = matrixOrFrames;
        } else if (matrixOrFrames && typeof matrixOrFrames === 'object') {
            // New format: { idle, attack, death }
            matrix = matrixOrFrames[frame] || matrixOrFrames.idle;
            key = `${key}_${frame}`;
        } else {
            return PIXI.Texture.EMPTY;
        }

        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = document.createElement('canvas');
        const rows = matrix.length;
        const cols = matrix[0] ? matrix[0].length : 0;
        const pixelSize = 1;
        canvas.width = cols * pixelSize;
        canvas.height = rows * pixelSize;
        const ctx = canvas.getContext('2d');

        for (let y = 0; y < rows; y++) {
            const row = matrix[y];
            for (let x = 0; x < row.length; x++) {
                const char = row[x];
                if (char === ' ' || char === '.') continue;

                const color = palette[char] || '#000000';
                ctx.fillStyle = color;
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }

        const texture = PIXI.Texture.from(canvas);
        texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

        this.cache.set(key, texture);
        return texture;
    }

    /**
     * Invalidate cached textures for a key prefix (used when switching frames).
     */
    invalidate(keyPrefix) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(keyPrefix)) {
                this.cache.delete(key);
            }
        }
    }
}

export default new PixelArtGenerator();
