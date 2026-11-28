/**
 * Safely converts a value to a number.
 *
 * @param {*} value Value
 * @param {number} fallback Fallback value
 * @returns {number}
 */
export default function toNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}
