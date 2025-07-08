/**
 * uiService.js
 * Responsibility: cache DOM elements, wire event listeners, and render UI updates.
 */

import { loadConfig, getConfig, updateConfig } from './configService.js';
import { getIphoneSizes, getGameTypeIdentifiers, getAvailableButtons } from './dataService.js';

class UIService {
  constructor() {
    // DOM elements
    this.menuToggle = document.getElementById('menuToggle');
    this.contextMenu = document.getElementById('contextMenu');
    this.overlays = {
      code: document.getElementById('codeOverlay'),
      gear: document.getElementById('gearSettingsOverlay'),
      settings: document.getElementById('settingsOverlay'),
      addControl: document.getElementById('addControlOverlay')
    };
    this.codeContent = document.getElementById('codeContent');
    this.phoneSelect = document.getElementById('phoneModel');
    this.gameSelect = document.getElementById('gameTypeIdentifier');
    this.consoleInfo = document.getElementById('consoleInfo');
    this.consoleIcon = document.getElementById('consoleIcon');
    this.consoleName = document.getElementById('consoleNameDisplay');
    this.consoleDetailsDisplay = document.getElementById('consoleDetailsDisplay');
    this.fullGameTypeIdentifier = document.getElementById('fullGameTypeIdentifier');
    this.screen = document.getElementById('screenRepresentation');
    this.screenMessage = document.getElementById('screenMessage');
    this.logicalDisplay = {
      container: document.getElementById('logicalDimensions'),
      model: document.getElementById('logicalModelDisplay'),
      width: document.getElementById('logicalWidthDisplay'),
      height: document.getElementById('logicalHeightDisplay')
    };
    this.addButton = document.getElementById('addButtonFloating');
    this.buttonOverlay = {
      noConsoleMsg: document.getElementById('noConsoleMessage'),
      optionsContainer: document.getElementById('buttonOptions'),
      typeSelect: document.getElementById('buttonType'),
      closeBtn: document.getElementById('addControlClose'),
      confirmBtn: document.getElementById('confirmAddControl'),
      xInput: document.getElementById('xPosition'),
      yInput: document.getElementById('yPosition'),
      widthInput: document.getElementById('controlWidth'),
      heightInput: document.getElementById('controlHeight'),
      extendedEdgeTopInput: document.getElementById('extendedEdgeTop'),
      extendedEdgeBottomInput: document.getElementById('extendedEdgeBottom'),
      extendedEdgeLeftInput: document.getElementById('extendedEdgeLeft'),
      extendedEdgeRightInput: document.getElementById('extendedEdgeRight')
    };
    this.settingsFields = {
      name: document.getElementById('skinName'),
      identifier: document.getElementById('skinIdentifier'),
      saveBtn: document.getElementById('settingsSave'),
      closeBtn: document.getElementById('settingsClose')
    };
    this.debugToggle = document.getElementById('debugToggle');
    // Data stores
    this.iphoneSizes = [];
    this.gameTypes = [];
    this.availableButtons = {};
  }

  async init() {
    // load config and data
    await loadConfig();
    [ this.iphoneSizes, this.gameTypes, this.availableButtons ] = await Promise.all([
      getIphoneSizes(),
      getGameTypeIdentifiers(),
      getAvailableButtons()
    ]);
    this.bindMenu();
    this.bindGlobalEvents();
    this.populateDropdowns();
    this.renderConfig();
    this.onGameTypeChange();
  }

  bindMenu() {
    this.menuToggle.addEventListener('click', () => {
      this.contextMenu.classList.toggle('open');
    });
  }

  populateDropdowns() {
    // phone models
    this.phoneSelect.innerHTML = '<option value="">Select a phone model</option>' +
      this.iphoneSizes.map(p => `<option value="${p.model}">${p.model}</option>`).join('');
    this.phoneSelect.value = this.iphoneSizes.find(p => p.model === 'iPhone 15 Pro')?.model || '';
    this.phoneSelect.dispatchEvent(new Event('change'));
    // game types
      this.gameSelect.innerHTML = '<option value="">Select a console</option>' +
        this.gameTypes.map(g => `<option value="${g.gameTypeIdentifier}">${g.console}</option>`).join('');
      this.gameSelect.value = getConfig().gameTypeIdentifier || '';
      this.gameSelect.dispatchEvent(new Event('change'));
  }

  bindGlobalEvents() {
    this.phoneSelect.addEventListener('change', () => this.onPhoneChange());
    this.gameSelect.addEventListener('change', () => this.onGameTypeChange());
    this.addButton.addEventListener('click', () => this.toggleAddOverlay());
    this.buttonOverlay.closeBtn.addEventListener('click', () => this.overlays.addControl.style.display = 'none');
    this.buttonOverlay.confirmBtn.addEventListener('click', () => this.onAddControl());
    this.settingsFields.saveBtn.addEventListener('click', () => this.onSaveSettings());
    this.settingsFields.closeBtn.addEventListener('click', () => this.overlays.settings.style.display = 'none');
    this.debugToggle.addEventListener('change', () => {
      updateConfig({ debug: this.debugToggle.checked });
      this.renderCode();
    });
    // context menu actions
    document.querySelector('#contextMenu button img[alt="Code"]').parentElement
      .addEventListener('click', () => this.showOverlay('code'));
    document.querySelector('#contextMenu button img[alt="Settings"]').parentElement
      .addEventListener('click', () => this.showOverlay('gear'));
    document.querySelector('#contextMenu button img[alt="Navigation"]').parentElement
      .addEventListener('click', () => this.showOverlay('settings'));
    document.querySelector('#contextMenu button img[alt="Close Menu"]').parentElement
      .addEventListener('click', () => this.contextMenu.classList.remove('open'));
    this.overlays.code.querySelector('#codeClose')
      .addEventListener('click', () => this.overlays.code.style.display = 'none');
    this.overlays.gear.querySelector('#gearSettingsClose')
      .addEventListener('click', () => this.overlays.gear.style.display = 'none');
  }

  onPhoneChange() {
    const model = this.phoneSelect.value;
    const data = this.iphoneSizes.find(p => p.model === model);
    if (data) {
      this.screen.style.width = data.logicalWidth + 'px';
      this.screen.style.height = data.logicalHeight + 'px';
      this.screenMessage.style.display = 'none';
      this.logicalDisplay.container.style.display = 'block';
      this.logicalDisplay.model.textContent = model;
      this.logicalDisplay.width.textContent = data.logicalWidth;
      this.logicalDisplay.height.textContent = data.logicalHeight;
      this.addButton.classList.remove('disabled');
    } else {
      this.resetScreen();
    }
  }

  onGameTypeChange() {
    const val = this.gameSelect.value;
    const cfg = getConfig();
    updateConfig({ gameTypeIdentifier: val });
    this.fullGameTypeIdentifier.textContent = val;
    this.consoleDetailsDisplay.style.display = val ? 'block' : 'none';
    this.toggleAddOverlay(false);
    if (val) {
      const type = val.split('.').pop();
      const entry = this.gameTypes.find(g => g.gameTypeIdentifier === val);
      this.consoleIcon.src = `icons/consoles/${type}.png`;
      this.consoleName.textContent = entry?.console || '';
      this.consoleInfo.style.display = 'flex';
    } else {
      this.consoleInfo.style.display = 'none';
    }
  }

  toggleAddOverlay(open=true) {
    if (open && !this.addButton.classList.contains('disabled')) {
      this.overlays.addControl.style.display = 'flex';
      const cfg = getConfig();
      const game = cfg.gameTypeIdentifier?.split('.').pop();
      if (!game) {
        this.buttonOverlay.noConsoleMsg.style.display = 'block';
        this.buttonOverlay.optionsContainer.style.display = 'none';
      } else {
        this.buttonOverlay.noConsoleMsg.style.display = 'none';
        this.buttonOverlay.optionsContainer.style.display = 'block';
        this.populateButtonTypes(game);
      }
    } else {
      this.overlays.addControl.style.display = 'none';
    }
  }

  populateButtonTypes(consoleKey) {
    const common = ['menu','quickSave','quickLoad','fastForward','toggleFastForward'];
    const specific = this.availableButtons[consoleKey] || [];
    let opts = `<option value="">Select a button type</option>`;
    specific.forEach(b => opts += `<option value="${b}">${b.toUpperCase()}</option>`);
    if (specific.length) opts += `<option disabled>----------</option>`;
    common.forEach(b => {
      const label = b.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
      opts += `<option value="${b}">${label} Button</option>`;
    });
    this.buttonOverlay.typeSelect.innerHTML = opts;
  }

  onAddControl() {
    const type = this.buttonOverlay.typeSelect.value;
    if (!type) return alert('Please select a button type');
    const x = +this.buttonOverlay.xInput.value;
    const y = +this.buttonOverlay.yInput.value;
    const w = +this.buttonOverlay.widthInput.value;
    const h = +this.buttonOverlay.heightInput.value;
    const top = +this.buttonOverlay.extendedEdgeTopInput.value;
    const bottom = +this.buttonOverlay.extendedEdgeBottomInput.value;
    const left = +this.buttonOverlay.extendedEdgeLeftInput.value;
    const right = +this.buttonOverlay.extendedEdgeRightInput.value;
    const el = document.createElement('div');
    el.className = 'control-element';
    el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    el.dataset.extendedEdges = JSON.stringify({ top, bottom, left, right });
    el.textContent = type;
    document.getElementById('screenRepresentation').appendChild(el);
    const cfg = getConfig();
    const portrait = cfg.representations.iphone.edgeToEdge.portrait;
    portrait.items.push({ type, x, y, width: w, height: h, extendedEdges: { top, bottom, left, right } });
    updateConfig({ representations: cfg.representations });
    this.overlays.addControl.style.display = 'none';
  }

  onSaveSettings() {
    const updates = {
      name: this.settingsFields.name.value,
      identifier: this.settingsFields.identifier.value
    };
    updateConfig(updates);
    this.overlays.settings.style.display = 'none';
  }

  showOverlay(key) {
    if (key === 'code') this.renderCode();
    if (key === 'gear') this.debugToggle.checked = getConfig().debug;
      if (key === 'settings') {
        const cfg = getConfig();
        this.settingsFields.name.value = cfg.name;
        this.settingsFields.identifier.value = cfg.identifier;
        this.gameSelect.value = cfg.gameTypeIdentifier || '';
        this.fullGameTypeIdentifier.textContent = cfg.gameTypeIdentifier || '';
        this.consoleDetailsDisplay.style.display = cfg.gameTypeIdentifier ? 'block' : 'none';
        this.onGameTypeChange();
      }
    this.overlays[key].style.display = 'flex';
    this.contextMenu.classList.remove('open');
  }


  renderCode() {
    this.codeContent.textContent = JSON.stringify(getConfig(),null,2);
  }

  resetScreen() {
    this.screen.style.width = '100%';
    this.screen.style.height = '100%';
    this.screenMessage.style.display = 'block';
    this.logicalDisplay.container.style.display = 'none';
    this.addButton.classList.add('disabled');
  }

  renderConfig() {
    this.renderCode();
  }
}

export default UIService;
