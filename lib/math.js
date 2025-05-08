// lib/math.js
// (From main🐙🐙🐙/index.js global functions)

/**
 * Linear interpolation
 * @param {number} p1 Start value
 * @param {number} p2 End value
 * @param {number} t Interpolation factor (0 to 1)
 * @returns {number} Interpolated value
 */
export function lerp(p1, p2, t) {
  return p1 + (p2 - p1) * t;
}

/**
 * Clamps a value between a minimum and maximum value
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 * @param {number} num Value to clamp
 * @returns {number} Clamped value
 */
export function clamp(min, max, num) {
  return Math.min(Math.max(num, min), max);
}

// Add any other simple, pure math/helper functions you find globally defined