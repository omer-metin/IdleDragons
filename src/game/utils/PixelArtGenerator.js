import * as PIXI from 'pixi.js';

class PixelArtGenerator {
    constructor() {
        this.cache = new Map();
    }

    getTexture(key, matrix, palette = {}, scale = 1) {
        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = document.createElement('canvas');
        const size = matrix.length;
        const pixelSize = 1; // Base size, we'll scale the sprite
        canvas.width = size * pixelSize;
        canvas.height = matrix[0].length * pixelSize;
        const ctx = canvas.getContext('2d');

        for (let y = 0; y < matrix.length; y++) {
            const row = matrix[y];
            for (let x = 0; x < row.length; x++) {
                const char = row[x];
                if (char === ' ' || char === '.') continue; // Transparent

                let color = palette[char] || '#000000';

                ctx.fillStyle = color;
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }

        const texture = PIXI.Texture.from(canvas);
        // Set nearest neighbor scaling for pixel art look
        texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

        this.cache.set(key, texture);
        return texture;
    }
}

export default new PixelArtGenerator();
