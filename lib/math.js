// lib/math.js

/**
 * Linear interpolation.
 * @param {number} p1 - Start value.
 * @param {number} p2 - End value.
 * @param {number} t - Interpolation factor (0 to 1).
 * @returns {number} Interpolated value.
 */
export function lerp(p1, p2, t) {
  return p1 + (p2 - p1) * t;
}

/**
 * Clamps a value between a minimum and maximum value.
 * @param {number} min - Minimum value.
 * @param {number} max - Maximum value.
 * @param {number} num - Value to clamp.
 * @returns {number} Clamped value.
 */
export function clamp(min, max, num) {
  return Math.min(Math.max(num, min), max);
}

/**
 * Maps a value from one range to another.
 * @param {number} value - The value to map.
 * @param {number} inMin - The minimum of the input range.
 * @param {number} inMax - The maximum of the input range.
 * @param {number} outMin - The minimum of the output range.
 * @param {number} outMax - The maximum of the output range.
 * @returns {number} The mapped value.
 */
export function map(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// Add other math utilities if needed (e.g., random number generation from legacy writeCt)
/**
 * Generates a random integer between min (inclusive) and max (exclusive).
 * @param {number} max - The upper bound (exclusive).
 * @param {number} [min=0] - The lower bound (inclusive).
 * @returns {number} Random integer.
 */
export function getRandomInt(max, min = 0) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}
