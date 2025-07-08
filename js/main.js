/**
 * main.js
 * Responsibility: bootstrap the UIService module.
 */

import UIService from './uiService.js';

(async () => {
  const ui = new UIService();
  await ui.init();
})();
