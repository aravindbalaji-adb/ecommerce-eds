const SVG_ATTRIBUTES = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/**
 * Builds an SVG data URI usable as an <img> src.
 * Colour must be baked in because <img> SVGs ignore currentColor.
 * @param {string} paths Inner SVG markup
 * @param {string} color Stroke colour
 * @returns {string} Data URI
 */
export function createSvgDataUri(paths, color) {
  const svg = `<svg ${SVG_ATTRIBUTES} stroke="${color}">${paths}</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const SVG_PATHS = {
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6"/>',
};

/**
 * @param {string} name Key of SVG_PATHS
 * @param {string} [color] Stroke colour
 * @returns {string} Data URI
 */
export function getSvgIcon(name, color = '#15252c') {
  return createSvgDataUri(SVG_PATHS[name] || '', color);
}

export const CLOSE_ICON = getSvgIcon('close', '#15252c');
export const FILTER_ICON = getSvgIcon('filter', '#008557');

// Used as a CSS mask, so only the shape matters; the card CSS sets the colour.
export const PRODUCT_FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none"><rect x="26" y="30" width="44" height="36" rx="4" stroke="#9ca3af" stroke-width="4"/><circle cx="59" cy="41" r="4" fill="#9ca3af"/><path d="M28 62l13-14 9 9 7-6 13 11" stroke="#9ca3af" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/></svg>',
)}`;

// Used as a CSS mask; the card CSS sets the colour.
export const STAR_ICON = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
)}`;

export const EMPTY_ICON = getSvgIcon('search', '#000');
