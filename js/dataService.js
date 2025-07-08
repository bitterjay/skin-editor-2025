/**
 * dataService.js
 * Responsibility: load JSON assets (iPhone sizes, game types, available buttons).
 */

async function fetchJsonOrEmpty(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Fetch failed: ' + url + ' -> ' + res.status);
    }
    return res.json();
  } catch (err) {
    console.warn('Failed to load ' + url + ', returning empty array.', err);
    return [];
  }
}

/**
 * Get iPhone sizes array.
 * @returns {Promise<Array>}
 */
export function getIphoneSizes() {
  return fetchJsonOrEmpty('Reference/iphone-sizes.json');
}

/**
 * Get game type identifiers array.
 * @returns {Promise<Array>}
 */
export function getGameTypeIdentifiers() {
  return fetchJsonOrEmpty('Reference/gameTypeIdentifiers.json');
}

/**
 * Get available buttons map.
 * Returns an object; on failure returns empty object.
 */
export async function getAvailableButtons() {
  try {
    const res = await fetch('Reference/available_buttons.json');
    if (!res.ok) {
      throw new Error('Fetch failed: Reference/available_buttons.json -> ' + res.status);
    }
    return res.json();
  } catch (err) {
    console.error('Error loading available_buttons.json:', err);
    return {};
  }
}
