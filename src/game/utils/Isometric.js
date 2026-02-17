import usePartyStore from '../../store/usePartyStore';

export const TILE_WIDTH = 100;
export const TILE_HEIGHT = 100;

// Linear Projection for Side-Scrolling look
// Grid X -> Screen X (Horizontal Line)
// Grid Y -> Screen Y (Depth/Lane, though we might just use one lane)

const SPACING_X = 140;

const getOffsetX = () => {
    // Dynamic centering:
    // Total width of the formation = (width - 1) * SPACING_X
    // We want the center of the formation to be at x=0
    // So the start (leftmost) should be at -TotalWidth / 2
    const { width } = usePartyStore.getState().gridSize;
    const totalWidth = (width - 1) * SPACING_X;
    return -(totalWidth / 2);
};

/**
 * Converts Grid coordinates (col, row) to Screen coordinates (x, y).
 * @param {number} x - Grid Column (0..3)
 * @param {number} y - Grid Row (0..3)
 * @returns {Object} { x, y } Screen coordinates
 */
export const toScreen = (gridX, gridY) => {
    // 1D Linear Layout (Left to Right)
    const offsetX = getOffsetX();

    return {
        x: offsetX + (gridX * SPACING_X),
        y: 0 // All in one horizontal line (center y relative to container)
    };
};

/**
 * Converts Screen coordinates (x, y) to Grid coordinates (col, row).
 * @param {number} x - Screen X
 * @param {number} y - Screen Y
 * @returns {Object} { x, y } Grid coordinates (approximate)
 */
export const toGrid = (screenX, screenY) => {
    const offsetX = getOffsetX();

    const approxX = Math.round((screenX - offsetX) / SPACING_X);
    const approxY = 0; // Always row 0 for linear layout

    return { x: approxX, y: approxY };
};
