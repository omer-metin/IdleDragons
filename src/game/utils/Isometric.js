export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

/**
 * Converts Grid coordinates (col, row) to Screen coordinates (x, y).
 * @param {number} x - Grid Column
 * @param {number} y - Grid Row
 * @returns {Object} { x, y } Screen coordinates
 */
export const toScreen = (isoX, isoY) => {
    return {
        x: Math.round((isoX - isoY) * TILE_WIDTH / 2),
        y: Math.round((isoX + isoY) * TILE_HEIGHT / 2)
    };
};

/**
 * Converts Screen coordinates (x, y) to Grid coordinates (col, row).
 * @param {number} x - Screen X
 * @param {number} y - Screen Y
 * @returns {Object} { x, y } Grid coordinates (floored)
 */
export const toGrid = (screenX, screenY) => {
    const isoX = Math.round((screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2);
    const isoY = Math.round((screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2);
    return { x: isoX, y: isoY };
};
