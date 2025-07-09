/**
 * configService.js
 * Responsibility: load and persist application configuration.
 */

let currentConfig = null;

/**
 * Load default configuration from Reference/default_config.json.
 * Falls back to an in-memory default if loading fails.
 */
export async function loadConfig() {
  try {
    const res = await fetch('Reference/default_config.json');
    if (!res.ok) throw new Error('Config file not found');
    currentConfig = await res.json();
  } catch (err) {
    console.warn('Falling back to embedded default config');
    currentConfig = {
      name: "",
      identifier: "",
      gameTypeIdentifier: null,
      debug: false,
      representations: {
        iphone: {
          edgeToEdge: {
            portrait: {
              assets: {},
              items: [],
              screens: [],
              mappingSize: { width: 0, height: 0 },
              extendedEdges: {},
              menuInsets: {}
            }
          }
        }
      }
    };
  }
  // Persist initial state
  localStorage.setItem('currentConfig', JSON.stringify(currentConfig));
  return currentConfig;
}

/**
 * Get the current in-memory config.
 */
export function getConfig() {
  if (currentConfig === null) {
    const stored = localStorage.getItem('currentConfig');
    currentConfig = stored ? JSON.parse(stored) : null;
  }
  return currentConfig;
}

/**
 * Update configuration fields and persist to localStorage.
 * @param {Object} updates Partial config fields to merge.
 */
export function updateConfig(updates) {
  const baseConfig = getConfig();
  currentConfig = {
    ...baseConfig,
    ...updates
  };

  // Reorder keys to place 'screens' between 'mappingSize' and 'extendedEdges' if present
  if (currentConfig.screens && currentConfig.representations?.iphone?.edgeToEdge?.portrait) {
    const portrait = currentConfig.representations.iphone.edgeToEdge.portrait;
    const { mappingSize, extendedEdges, ...restPortrait } = portrait;

    // Rebuild portrait with keys in desired order
    currentConfig.representations.iphone.edgeToEdge.portrait = {
      ...restPortrait,
      mappingSize,
      screens: currentConfig.screens,
      extendedEdges
    };

    // Remove screens from top-level if exists to avoid duplication
    if ('screens' in currentConfig) {
      delete currentConfig.screens;
    }
  }

  localStorage.setItem('currentConfig', JSON.stringify(currentConfig));
  return currentConfig;
}
