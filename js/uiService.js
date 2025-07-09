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
    this.screenOrientation = document.getElementById('screenOrientation');
    this.gameSelect = document.getElementById('gameTypeIdentifier');
    this.consoleInfo = document.getElementById('consoleInfo');
    this.consoleIcon = document.getElementById('consoleIcon');
    this.consoleName = document.getElementById('consoleNameDisplay');
    this.consoleDetailsDisplay = document.getElementById('consoleDetailsDisplay');
    this.fullGameTypeIdentifier = document.getElementById('fullGameTypeIdentifier');
    this.screen = document.getElementById('deviceRepresentation');
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
      cancelBtn: document.getElementById('cancelAddControl'),
      xInput: document.getElementById('xPosition'),
      yInput: document.getElementById('yPosition'),
      widthInput: document.getElementById('controlWidth'),
      heightInput: document.getElementById('controlHeight'),
      extendedEdgeTopInput: document.getElementById('extendedEdgeTop'),
      extendedEdgeBottomInput: document.getElementById('extendedEdgeBottom'),
      extendedEdgeLeftInput: document.getElementById('extendedEdgeLeft'),
      extendedEdgeRightInput: document.getElementById('extendedEdgeRight'),
      thumbstickOptions: document.getElementById('thumbstickOptions'),
      thumbstickImage: document.getElementById('thumbstickImage')
    };
    this.settingsFields = {
      name: document.getElementById('skinName'),
      identifier: document.getElementById('skinIdentifier'),
      saveBtn: document.getElementById('settingsSave'),
      closeBtn: document.getElementById('settingsClose')
    };
    this.debugToggle = document.getElementById('debugToggle');
    // Control options panel
    this.controlOptionsPanel = document.getElementById('controlOptionsPanel');
    this.screenOptionsPanel = document.getElementById('screenOptionsPanel');
    this.moveButton = document.getElementById('moveButton');
    this.editButton = document.getElementById('editButton');
    this.editScreenButton = document.getElementById('editScreenButton');
    this.deleteButton = document.getElementById('deleteButton');
    this.selectedControl = null;
    // Data stores
    this.iphoneSizes = [];
    this.gameTypes = [];
    this.availableButtons = {};
  }

  async init() {
    await loadConfig();
    [ this.iphoneSizes, this.gameTypes, this.availableButtons ] = await Promise.all([
      getIphoneSizes(),
      getGameTypeIdentifiers(),
      getAvailableButtons()
    ]);
    this.bindMenu();
    this.bindGlobalEvents();
    this.bindControlOptions();
    this.bindAddScreenEvents();
    this.populateDropdowns();
    this.renderCode();
    this.onGameTypeChange();
  }


    bindAddScreenEvents() {
    this.addScreenButton = document.getElementById('addScreenFloating');
    this.addScreenOverlay = document.getElementById('addScreenOverlay');
    this.addScreenForm = document.getElementById('addScreenForm');
    this.confirmAddScreenBtn = document.getElementById('confirmAddScreen');
    this.cancelAddScreenBtn = document.getElementById('cancelAddScreen');
    this.addScreenHeader = document.getElementById('addScreenHeader'); // Added for header text

    this.isEditingScreen = false;
    this.editingScreenIndex = null;

    this.addScreenButton.addEventListener('click', () => {
      this.isEditingScreen = false;
      this.editingScreenIndex = null;
      this.addScreenForm.reset();
      if (this.addScreenHeader) this.addScreenHeader.textContent = 'Add Screen';
      if (this.confirmAddScreenBtn) this.confirmAddScreenBtn.textContent = 'Confirm';
      this.addScreenOverlay.style.display = 'flex';
    });

    this.cancelAddScreenBtn.addEventListener('click', () => {
      this.isEditingScreen = false;
      this.editingScreenIndex = null;
      this.addScreenOverlay.style.display = 'none';
      this.addScreenForm.reset();
    });

    this.addScreenForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.isEditingScreen) {
        this.onUpdateScreen();
      } else {
        this.onAddScreen();
      }
    });
  }

    

  onUpdateScreen() {
    if (this.editingScreenIndex === null) return alert('No screen selected for update.');

    const inputX = +this.addScreenForm.inputX.value;
    const inputY = +this.addScreenForm.inputY.value;
    const inputWidth = +this.addScreenForm.inputWidth.value;
    const inputHeight = +this.addScreenForm.inputHeight.value;
    const outputX = +this.addScreenForm.outputX.value;
    const outputY = +this.addScreenForm.outputY.value;
    const outputWidth = +this.addScreenForm.outputWidth.value;
    const outputHeight = +this.addScreenForm.outputHeight.value;

    if ([inputX, inputY, inputWidth, inputHeight, outputX, outputY, outputWidth, outputHeight].some(isNaN)) {
      alert('Please fill in all fields with valid numbers.');
      return;
    }

    const cfg = getConfig();
    if (!cfg.representations?.iphone?.edgeToEdge?.portrait?.screens || !cfg.representations.iphone.edgeToEdge.portrait.screens[this.editingScreenIndex]) {
      alert('Screen data not found.');
      return;
    }

    cfg.representations.iphone.edgeToEdge.portrait.screens[this.editingScreenIndex] = {
      inputFrame: { x: inputX, y: inputY, width: inputWidth, height: inputHeight },
      outputFrame: { x: outputX, y: outputY, width: outputWidth, height: outputHeight }
    };

    updateConfig({ screens: cfg.representations.iphone.edgeToEdge.portrait.screens });

    // Update the DOM element for the screen
    const screenDivs = this.screen.querySelectorAll('.screen-representation-item');
    if (screenDivs[this.editingScreenIndex]) {
      const screenDiv = screenDivs[this.editingScreenIndex];
      screenDiv.style.left = `${outputX}px`;
      screenDiv.style.top = `${outputY}px`;
      screenDiv.style.width = `${outputWidth}px`;
      screenDiv.style.height = `${outputHeight}px`;
    }

    this.addScreenOverlay.style.display = 'none';
    this.addScreenForm.reset();
    this.isEditingScreen = false;
    this.editingScreenIndex = null;

    this.renderCode();
  }

  onAddScreen() {
    const inputX = +document.getElementById('inputX').value;
    const inputY = +document.getElementById('inputY').value;
    const inputWidth = +document.getElementById('inputWidth').value;
    const inputHeight = +document.getElementById('inputHeight').value;
    const outputX = +document.getElementById('outputX').value;
    const outputY = +document.getElementById('outputY').value;
    const outputWidth = +document.getElementById('outputWidth').value;
    const outputHeight = +document.getElementById('outputHeight').value;

    if ([inputX, inputY, inputWidth, inputHeight, outputX, outputY, outputWidth, outputHeight].some(isNaN)) {
      alert('Please fill in all fields with valid numbers.');
      return;
    }

    const newScreen = {
      inputFrame: {
        x: inputX,
        y: inputY,
        width: inputWidth,
        height: inputHeight
      },
      outputFrame: {
        x: outputX,
        y: outputY,
        width: outputWidth,
        height: outputHeight
      }
    };

    const cfg = getConfig();
    if (!cfg.screens) {
      cfg.screens = [];
    }
    if (!cfg.representations.iphone.edgeToEdge.portrait.screens) {
      cfg.representations.iphone.edgeToEdge.portrait.screens = [];
    }
    cfg.representations.iphone.edgeToEdge.portrait.screens.push(newScreen);
    updateConfig({ screens: cfg.representations.iphone.edgeToEdge.portrait.screens });

    // Create a new element to represent the screen inside #screenRepresentation
    const screenDiv = document.createElement('div');
    screenDiv.classList.add('screen-representation-item');
    screenDiv.style.position = 'absolute';
    screenDiv.style.left = `${outputX}px`;
    screenDiv.style.top = `${outputY}px`;
    screenDiv.style.width = `${outputWidth}px`;
    screenDiv.style.height = `${outputHeight}px`;
    screenDiv.style.border = '2px solid blue';
    screenDiv.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
    // screenDiv.style.pointerEvents = 'none'; // So it doesn't interfere with other UI interactions
    screenDiv.style.boxSizing = 'border-box';

    // Add data attribute to track screen index
    const screenIndex = cfg.screens.length; // 1-based index
    screenDiv.dataset.screenIndex = screenIndex.toString();

    this.screen.appendChild(screenDiv);

    this.addScreenOverlay.style.display = 'none';
    this.addScreenForm.reset();

    // Optionally, trigger UI update or re-render if needed
    this.renderCode();
  }

  bindMenu() {
    this.menuToggle.addEventListener('click', () => {
      this.contextMenu.classList.toggle('open');
    });
  }

  bindGlobalEvents() {
    this.phoneSelect.addEventListener('change', () => this.onPhoneChange());
    this.screenOrientation.addEventListener('change', () => this.onOrientationChange());
    this.gameSelect.addEventListener('change', () => this.onGameTypeChange());
    this.addButton.addEventListener('click', () => this.toggleAddOverlay());
    // this.buttonOverlay.closeBtn.addEventListener('click', () => this.overlays.addControl.style.display = 'none');
    this.buttonOverlay.cancelBtn.addEventListener('click', () => this.overlays.addControl.style.display = 'none');
    // Only one event listener for confirmBtn, handles both add and update
    this.buttonOverlay.confirmBtn.addEventListener('click', () => {
      if (this.isEditing && this.editingControlId) {
        this.onUpdateControl(this.editingControlId);
        this.isEditing = false;
        this.editingControlId = null;
        this.buttonOverlay.confirmBtn.textContent = 'Confirm';
        delete this.buttonOverlay.confirmBtn.dataset.editingId;
      } else {
        this.onAddControl();
      }
    });
    this.buttonOverlay.typeSelect.addEventListener('change', () => {
      if (this.buttonOverlay.typeSelect.value === 'thumbstick') {
        this.buttonOverlay.thumbstickOptions.style.display = 'block';
      } else {
        this.buttonOverlay.thumbstickOptions.style.display = 'none';
      }
    });
    
    // Debug button to show control options panel
    const debugShowPanel = document.getElementById('debugShowPanel');
    if (debugShowPanel) {
      debugShowPanel.addEventListener('click', () => {
        console.log('Debug button clicked, showing control options panel');
        this.controlOptionsPanel.style.display = 'flex';
        this.controlOptionsPanel.style.visibility = 'visible';
        this.controlOptionsPanel.style.opacity = '1';
        this.controlOptionsPanel.classList.remove('hidden');
      });
    }
    this.settingsFields.saveBtn.addEventListener('click', () => this.onSaveSettings());
    this.settingsFields.closeBtn.addEventListener('click', () => this.overlays.settings.style.display = 'none');
    this.debugToggle.addEventListener('change', () => {
      updateConfig({ debug: this.debugToggle.checked });
      this.renderCode();
    });
    // context menu
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

    bindControlOptions() {
    // Initialize the control options panel
    // Force it to be hidden initially
    this.controlOptionsPanel.classList.add('hidden');
    this.screenOptionsPanel.classList.add('hidden');
    console.log('Control options panel initialized:', this.controlOptionsPanel);
    console.log('Screen options panel initialized:', this.screenOptionsPanel);
    
    // Show panel on button control click
    this.screen.addEventListener('click', e => {
      console.log('Screen clicked', e.target);
      const buttonWrapper = e.target.closest('.button-representation');
      if (buttonWrapper) {
        console.log('Button representation clicked', buttonWrapper);
        this.selectedControl = buttonWrapper;
        
        // Hide screen options panel if visible
        this.screenOptionsPanel.classList.add('hidden');
        
        // Show control options panel
        this.controlOptionsPanel.style.display = 'flex';
        this.controlOptionsPanel.style.visibility = 'visible';
        this.controlOptionsPanel.style.opacity = '1';
        
        // Use setTimeout to ensure the display change takes effect before removing 'hidden'
        setTimeout(() => {
          this.controlOptionsPanel.classList.remove('hidden');
        }, 10);
        return;
      }
      
      const screenWrapper = e.target.closest('.screen-representation-item');
      if (screenWrapper) {
        console.log('Screen representation item clicked', screenWrapper);
        this.selectedControl = screenWrapper;
        
        // Hide control options panel if visible
        this.controlOptionsPanel.classList.add('hidden');
        
        // Show screen options panel
        this.screenOptionsPanel.style.display = 'flex';
        this.screenOptionsPanel.style.visibility = 'visible';
        this.screenOptionsPanel.style.opacity = '1';
        
        // Use setTimeout to ensure the display change takes effect before removing 'hidden'
        setTimeout(() => {
          this.screenOptionsPanel.classList.remove('hidden');
        }, 10);
        return;
      }
      
      // If click outside both, hide both panels
      this.controlOptionsPanel.classList.add('hidden');
      this.screenOptionsPanel.classList.add('hidden');
    });
    
    // Direct event listeners on each button representation
    // This ensures we catch clicks even if event delegation fails
    const updateButtonListeners = () => {
      document.querySelectorAll('.button-representation').forEach(btn => {
        // Only add if not already added
        if (!btn.hasAttribute('data-has-click-listener')) {
          btn.setAttribute('data-has-click-listener', 'true');
          btn.addEventListener('click', e => {
            console.log('Direct button click', btn);
            this.selectedControl = btn;
            
            // Hide screen options panel if visible
            this.screenOptionsPanel.classList.add('hidden');
            
            // Show control options panel
            this.controlOptionsPanel.style.display = 'flex';
            setTimeout(() => {
              this.controlOptionsPanel.classList.remove('hidden');
            }, 10);
            
            e.stopPropagation(); // Prevent bubbling
          });
        }
      });
    };
    
    // Direct event listeners on each screen representation item
    const updateScreenListeners = () => {
      document.querySelectorAll('.screen-representation-item').forEach(screenItem => {
        if (!screenItem.hasAttribute('data-has-click-listener')) {
          screenItem.setAttribute('data-has-click-listener', 'true');
          screenItem.addEventListener('click', e => {
            console.log('Direct screen representation item click', screenItem);
            // Remove active class from all screen items
            document.querySelectorAll('.screen-representation-item.active').forEach(item => {
              item.classList.remove('active');
            });
            // Add active class to clicked item
            screenItem.classList.add('active');
            this.selectedControl = screenItem;
            
            // Hide control options panel if visible
            this.controlOptionsPanel.classList.add('hidden');
            
            // Show screen options panel
            this.screenOptionsPanel.style.display = 'flex';
            setTimeout(() => {
              this.screenOptionsPanel.classList.remove('hidden');
            }, 10);
            
            e.stopPropagation(); // Prevent bubbling
          });
        }
      });
    };
    
    // Initial setup
    updateButtonListeners();
    updateScreenListeners();

    // Add drag functionality for active screen item
    let dragState = {
      dragging: false,
      startY: 0,
      startTop: 0,
      activeItem: null
    };

    const onMouseMove = (e) => {
      if (!dragState.dragging || !dragState.activeItem) return;
      e.preventDefault();
      const deltaY = e.clientY - dragState.startY;
      let newTop = dragState.startTop + deltaY;

      // Clamp newTop within parent container bounds
      const parent = dragState.activeItem.parentElement;
      const parentHeight = parent.clientHeight;
      const itemHeight = dragState.activeItem.offsetHeight;
      newTop = Math.max(0, Math.min(newTop, parentHeight - itemHeight));

      dragState.activeItem.style.top = `${newTop}px`;
    };

    const onMouseUp = (e) => {
      if (!dragState.dragging || !dragState.activeItem) return;
      dragState.dragging = false;

      // Update config with new position
      const screenIndex = parseInt(dragState.activeItem.dataset.screenIndex);
      if (!isNaN(screenIndex)) {
        const cfg = getConfig();
        if (cfg.representations?.iphone?.edgeToEdge?.portrait?.screens && cfg.representations.iphone.edgeToEdge.portrait.screens[screenIndex]) {
          const newTop = parseInt(dragState.activeItem.style.top) || 0;
          cfg.representations.iphone.edgeToEdge.portrait.screens[screenIndex].outputFrame.y = newTop;
          updateConfig({ screens: cfg.representations.iphone.edgeToEdge.portrait.screens });
        }
      }

      dragState.activeItem = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    const onMouseDown = (e) => {
      const target = e.target.closest('.screen-representation-item.active');
      if (!target) return;
      e.preventDefault();
      dragState.dragging = true;
      dragState.startY = e.clientY;
      dragState.startTop = parseInt(target.style.top) || 0;
      dragState.activeItem = target;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    this.screen.addEventListener('mousedown', onMouseDown);

    // Touch events for mobile
    const onTouchMove = (e) => {
      if (!dragState.dragging || !dragState.activeItem) return;
      e.preventDefault();
      const touch = e.touches[0];
      const deltaY = touch.clientY - dragState.startY;
      let newTop = dragState.startTop + deltaY;

      const parent = dragState.activeItem.parentElement;
      const parentHeight = parent.clientHeight;
      const itemHeight = dragState.activeItem.offsetHeight;
      newTop = Math.max(0, Math.min(newTop, parentHeight - itemHeight));

      dragState.activeItem.style.top = `${newTop}px`;
    };

    const onTouchEnd = (e) => {
      if (!dragState.dragging || !dragState.activeItem) return;
      dragState.dragging = false;

      const screenIndex = parseInt(dragState.activeItem.dataset.screenIndex);
      if (!isNaN(screenIndex)) {
        const cfg = getConfig();
        if (cfg.representations?.iphone?.edgeToEdge?.portrait?.screens && cfg.representations.iphone.edgeToEdge.portrait.screens[screenIndex]) {
          const newTop = parseInt(dragState.activeItem.style.top) || 0;
          cfg.representations.iphone.edgeToEdge.portrait.screens[screenIndex].outputFrame.y = newTop;
          updateConfig({ screens: cfg.representations.iphone.edgeToEdge.portrait.screens });
        }
      }

      dragState.activeItem = null;
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    const onTouchStart = (e) => {
      const target = e.target.closest('.screen-representation-item.active');
      if (!target) return;
      e.preventDefault();
      const touch = e.touches[0];
      dragState.dragging = true;
      dragState.startY = touch.clientY;
      dragState.startTop = parseInt(target.style.top) || 0;
      dragState.activeItem = target;

      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    };

    this.screen.addEventListener('touchstart', onTouchStart);

    // Setup a mutation observer to watch for new buttons and screen items
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          updateButtonListeners();
          updateScreenListeners();
        }
      });
    });
    
    // Start observing
    observer.observe(this.screen, { childList: true, subtree: true });
    
    // Option buttons
    this.moveButton.addEventListener('click', () => this.onMoveControl());
    this.editButton.addEventListener('click', () => this.onEditControl());
    this.editScreenButton.addEventListener('click', () => this.onEditScreen());
    this.deleteButton.addEventListener('click', () => this.onDeleteControl());

    // New alignment buttons
    this.alignVerticalButton = document.getElementById('alignVerticalButton');
    this.alignHorizontalButton = document.getElementById('alignHorizontalButton');
    if (this.alignVerticalButton) {
      this.alignVerticalButton.addEventListener('click', () => this.onAlignVertical());
    }
    if (this.alignHorizontalButton) {
      this.alignHorizontalButton.addEventListener('click', () => this.onAlignHorizontal());
    }

    // New full width button
    this.stretchWidthButton = document.createElement('button');
    this.stretchWidthButton.id = 'stretchWidthButton';
    this.stretchWidthButton.className = 'option-button';
    this.stretchWidthButton.title = 'Stretch to Logical Width';
    const img = document.createElement('img');
    img.src = 'icons/full-width_icon.svg';
    img.className = 'icon';
    img.alt = 'Stretch Width';
    this.stretchWidthButton.appendChild(img);
    const screenOptionsContainer = this.screenOptionsPanel.querySelector('.screen-options-container');
    if (screenOptionsContainer) {
      screenOptionsContainer.appendChild(this.stretchWidthButton);
    }

    this.stretchWidthButton.addEventListener('click', () => {
      if (!this.selectedControl) return alert('No screen selected.');
      const model = this.phoneSelect.value;
      if (!model) return alert('Please select a phone model.');
      const phoneData = this.iphoneSizes.find(p => p.model === model);
      if (!phoneData) return alert('Phone model data not found.');

      let logicalWidth = phoneData.logicalWidth;
      let logicalHeight = phoneData.logicalHeight;
      if (this.screenOrientation.value === 'landscape') {
        [logicalWidth, logicalHeight] = [logicalHeight, logicalWidth];
      }

      const screenEl = this.selectedControl;
      const currentWidth = parseFloat(screenEl.style.width) || screenEl.clientWidth;
      const currentHeight = parseFloat(screenEl.style.height) || screenEl.clientHeight;
      if (!currentWidth || !currentHeight) return alert('Current screen dimensions are invalid.');

      const aspectRatio = currentHeight / currentWidth;
      const newWidth = logicalWidth;
      const newHeight = newWidth * aspectRatio;

      // Update DOM
      screenEl.style.width = `${newWidth}px`;
      screenEl.style.height = `${newHeight}px`;

      // Update config
      const screenIndex = parseInt(screenEl.dataset.screenIndex);
      if (screenIndex < 0) return;
    const cfg = getConfig();
    if (!cfg.representations?.iphone?.edgeToEdge?.portrait?.screens || !cfg.representations.iphone.edgeToEdge.portrait.screens[screenIndex]) return;
    cfg.representations.iphone.edgeToEdge.portrait.screens[screenIndex].outputFrame.width = newWidth;
    cfg.representations.iphone.edgeToEdge.portrait.screens[screenIndex].outputFrame.height = newHeight;
    updateConfig({ screens: cfg.representations.iphone.edgeToEdge.portrait.screens });
  });
    
    // Hide when clicking outside
    window.addEventListener('click', e => {
      if (!e.target.closest('.button-representation') && !e.target.closest('#controlOptionsPanel')) {
        this.controlOptionsPanel.classList.add('hidden');
      }
      if (!e.target.closest('.screen-representation-item') && !e.target.closest('#screenOptionsPanel')) {
        this.screenOptionsPanel.classList.add('hidden');
        // Remove active class from any active screen
        document.querySelectorAll('.screen-representation-item.active').forEach(item => {
          item.classList.remove('active');
        });
        this.selectedControl = null;
      }
    });

    // New aspect ratio button
    this.aspectRatioButton = document.createElement('button');
    this.aspectRatioButton.id = 'aspectRatioButton';
    this.aspectRatioButton.className = 'option-button';
    this.aspectRatioButton.title = 'Adjust Height to Console Aspect Ratio';
    const aspectRatioImg = document.createElement('img');
    aspectRatioImg.src = 'icons/aspect-ratio_icon.svg';
    aspectRatioImg.className = 'icon';
    aspectRatioImg.alt = 'Aspect Ratio';
    this.aspectRatioButton.appendChild(aspectRatioImg);
    if (screenOptionsContainer) {
      screenOptionsContainer.appendChild(this.aspectRatioButton);
    }

    this.aspectRatioButton.addEventListener('click', () => {
      if (!this.selectedControl) return alert('No screen selected.');
      const screenEl = this.selectedControl;
      const screenIndex = parseInt(screenEl.dataset.screenIndex);
      if (screenIndex < 0) return alert('Invalid screen selected.');

      const cfg = getConfig();
      if (!cfg.representations?.iphone?.edgeToEdge?.portrait?.screens || !cfg.representations.iphone.edgeToEdge.portrait.screens[screenIndex]) {
        return alert('Screen data not found.');
      }
      const screenData = cfg.representations.iphone.edgeToEdge.portrait.screens[screenIndex];

      // Get the current outputFrame width
      const currentWidth = screenData.outputFrame.width;
      if (!currentWidth) return alert('Current outputFrame width is invalid.');

      // Get the console aspect ratio from the gameTypeIdentifier
      const gameTypeIdentifier = cfg.gameTypeIdentifier;
      if (!gameTypeIdentifier) return alert('No console selected.');

      const consoleKey = gameTypeIdentifier.split('.').pop();
      if (!consoleKey) return alert('Invalid console key.');

      // Load aspect ratios from the JSON file
      fetch('Reference/console-aspect-ratios.json')
        .then(response => response.json())
        .then(aspectRatios => {
          const ratioStr = aspectRatios[consoleKey];
          if (!ratioStr) return alert('Aspect ratio not found for console: ' + consoleKey);

          // Parse ratio string like "4/3"
          const [wRatio, hRatio] = ratioStr.split('/').map(Number);
          if (!wRatio || !hRatio) return alert('Invalid aspect ratio format.');

          // Calculate new height based on current width and aspect ratio
          const newHeight = currentWidth * (hRatio / wRatio);

          // Update DOM element height
          screenEl.style.height = `${newHeight}px`;

          // Update config outputFrame height
          cfg.representations.iphone.edgeToEdge.portrait.screens[screenIndex].outputFrame.height = newHeight;
          updateConfig({ screens: cfg.representations.iphone.edgeToEdge.portrait.screens });
        })
        .catch(err => {
          alert('Failed to load aspect ratios: ' + err.message);
        });
    });
  }

  onAlignVertical() {
    if (!this.selectedControl) return;
    const parentHeight = this.screen.clientHeight;
    const controlHeight = this.selectedControl.clientHeight;
    const newTop = Math.round((parentHeight - controlHeight) / 2);
    this.selectedControl.style.top = `${newTop}px`;
    this.updateScreenPositionInConfig();
  }


  onAlignHorizontal() {
    if (!this.selectedControl) return;
    const parentWidth = this.screen.clientWidth;
    const controlWidth = this.selectedControl.clientWidth;
    let newLeft = Math.round((parentWidth - controlWidth) / 2);
    newLeft = newLeft - 2; // Adjust by -2px as requested
    this.selectedControl.style.left = `${newLeft}px`;
    this.updateScreenPositionInConfig();
  }
  
  bindAddScreenEvents() {
    this.addScreenButton = document.getElementById('addScreenFloating');
    this.addScreenOverlay = document.getElementById('addScreenOverlay');
    this.addScreenForm = document.getElementById('addScreenForm');
    this.confirmAddScreenBtn = document.getElementById('confirmAddScreen');
    this.cancelAddScreenBtn = document.getElementById('cancelAddScreen');
    this.addScreenHeader = document.getElementById('addScreenHeader'); // Added for header text

    this.isEditingScreen = false;
    this.editingScreenIndex = null;

    this.addScreenButton.addEventListener('click', () => {
      this.isEditingScreen = false;
      this.editingScreenIndex = null;
      this.addScreenForm.reset();
      if (this.addScreenHeader) this.addScreenHeader.textContent = 'Add Screen';
      if (this.confirmAddScreenBtn) this.confirmAddScreenBtn.textContent = 'Confirm';
      this.addScreenOverlay.style.display = 'flex';
    });

    this.cancelAddScreenBtn.addEventListener('click', () => {
      this.isEditingScreen = false;
      this.editingScreenIndex = null;
      this.addScreenOverlay.style.display = 'none';
      this.addScreenForm.reset();
    });

    this.addScreenForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.isEditingScreen) {
        this.onUpdateScreen();
      } else {
        this.onAddScreen();
      }
    });
  }

  onEditScreen() {
    if (!this.selectedControl) return alert('No screen selected to edit.');
    if (!this.selectedControl.classList.contains('screen-representation-item')) {
      return alert('Please select a screen to edit first.');
    }
    const screenIndexStr = this.selectedControl.dataset.screenIndex;
    if (!screenIndexStr) return alert('Selected screen has no index.');
    const screenIndex = parseInt(screenIndexStr);
    if (isNaN(screenIndex) || screenIndex < 0) return alert('Invalid screen selected.');

    const cfg = getConfig();
    if (!cfg.representations?.iphone?.edgeToEdge?.portrait?.screens || !cfg.representations.iphone.edgeToEdge.portrait.screens[screenIndex]) return alert('Screen data not found.');

    const screenData = cfg.representations.iphone.edgeToEdge.portrait.screens[screenIndex];

    // Populate the add screen form with existing data
    this.addScreenForm.inputX.value = screenData.inputFrame.x;
    this.addScreenForm.inputY.value = screenData.inputFrame.y;
    this.addScreenForm.inputWidth.value = screenData.inputFrame.width;
    this.addScreenForm.inputHeight.value = screenData.inputFrame.height;
    this.addScreenForm.outputX.value = screenData.outputFrame.x;
    this.addScreenForm.outputY.value = screenData.outputFrame.y;
    this.addScreenForm.outputWidth.value = screenData.outputFrame.width;
    this.addScreenForm.outputHeight.value = screenData.outputFrame.height;

    this.isEditingScreen = true;
    this.editingScreenIndex = screenIndex;

    if (this.addScreenHeader) this.addScreenHeader.textContent = 'Edit Screen';
    if (this.confirmAddScreenBtn) this.confirmAddScreenBtn.textContent = 'Update';

    this.addScreenOverlay.style.display = 'flex';
    this.screenOptionsPanel.classList.add('hidden');
  }

  updateScreenPositionInConfig() {
    if (!this.selectedControl) return;
    const left = parseInt(this.selectedControl.style.left) || 0;
    const top = parseInt(this.selectedControl.style.top) || 0;
    const screenIndex = parseInt(this.selectedControl.dataset.screenIndex);
    if (screenIndex < 0) return;
    const cfg = getConfig();
    if (!cfg.representations?.iphone?.edgeToEdge?.portrait?.screens || !cfg.representations.iphone.edgeToEdge.portrait.screens[screenIndex]) return;
    cfg.representations.iphone.edgeToEdge.portrait.screens[screenIndex].outputFrame.x = left;
    cfg.representations.iphone.edgeToEdge.portrait.screens[screenIndex].outputFrame.y = top;
    updateConfig({ screens: cfg.representations.iphone.edgeToEdge.portrait.screens });
  }

  populateDropdowns() {
    this.phoneSelect.innerHTML = '<option value="">Select a phone model</option>' +
      this.iphoneSizes.map(p => `<option value="${p.model}">${p.model}</option>`).join('');
    this.phoneSelect.value = this.iphoneSizes.find(p => p.model === 'iPhone 15 Pro')?.model || '';
    this.phoneSelect.dispatchEvent(new Event('change'));

    this.gameSelect.innerHTML = '<option value="">Select a console</option>' +
      this.gameTypes.map(g => `<option value="${g.gameTypeIdentifier}">${g.console}</option>`).join('');
    this.gameSelect.value = getConfig().gameTypeIdentifier || '';
    this.gameSelect.dispatchEvent(new Event('change'));
  }

  onPhoneChange() {
    const model = this.phoneSelect.value;
    const data = this.iphoneSizes.find(p => p.model === model);
    if (data) {
      let w = data.logicalWidth, h = data.logicalHeight;
      if (this.screenOrientation.value === 'landscape') [w, h] = [h, w];
      this.screen.style.width = w + 'px';
      this.screen.style.height = h + 'px';
      this.screenMessage.style.display = 'none';
      this.logicalDisplay.container.style.display = 'flex';
      this.logicalDisplay.model.textContent = model;
      this.logicalDisplay.width.textContent = w;
      this.logicalDisplay.height.textContent = h;
      this.addButton.classList.remove('disabled');
      const cfg = getConfig();
      cfg.representations.iphone.edgeToEdge.portrait.mappingSize = { width: w, height: h };
      updateConfig({ representations: cfg.representations });
    } else {
      this.resetScreen();
    }
  }

  onOrientationChange() {
    this.onPhoneChange();
  }

  onGameTypeChange() {
    const val = this.gameSelect.value;
    updateConfig({ gameTypeIdentifier: val });
    this.fullGameTypeIdentifier.textContent = val;
    this.consoleDetailsDisplay.style.display = val ? 'block' : 'none';
    this.toggleAddOverlay(false);
    if (val) {
      const key = val.split('.').pop();
      const entry = this.gameTypes.find(g => g.gameTypeIdentifier === val);
      this.consoleIcon.src = `icons/consoles/${key}.png`;
      this.consoleName.textContent = entry?.console || '';
      this.consoleInfo.style.display = 'flex';
    } else {
      this.consoleInfo.style.display = 'none';
    }
  }

  toggleAddOverlay(open = true) {
    if (open && !this.addButton.classList.contains('disabled')) {
      this.overlays.addControl.style.display = 'flex';
      const key = getConfig().gameTypeIdentifier?.split('.').pop();
      if (!key) {
        this.buttonOverlay.noConsoleMsg.style.display = 'block';
        this.buttonOverlay.optionsContainer.style.display = 'none';
      } else {
        this.buttonOverlay.noConsoleMsg.style.display = 'none';
        this.buttonOverlay.optionsContainer.style.display = 'block';
        this.populateButtonTypes(key);
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

    const count = document.querySelectorAll(`#screenRepresentation div[data-type="${type}"]`).length + 1;
    const wrapper = document.createElement('div');
    wrapper.id = `${type}-${count}`;
    wrapper.dataset.type = type;
    wrapper.dataset.instance = count;
    wrapper.classList.add('button-representation');
    wrapper.style.position = 'absolute';
    wrapper.style.left = `${x - left}px`;
    wrapper.style.top = `${y - top}px`;
    wrapper.style.width = `${w + left + right}px`;
    wrapper.style.height = `${h + top + bottom}px`;

    const outline = document.createElement('div');
    outline.className = 'control-outline';
    outline.style.cssText = 'position:absolute;inset:0;border:2px solid rgba(255,0,0,0.4);background-color:rgba(255,0,0,0.5);pointer-events:none;';

    const el = document.createElement('div');
    el.className = 'control-element';
    el.style.cssText = `position:absolute;left:${left}px;top:${top}px;width:${w}px;height:${h}px`;
    el.innerHTML = `<span>${type}</span>`;
    el.dataset.extendedEdges = JSON.stringify({ top, bottom, left, right });

    wrapper.append(outline, el);
    this.screen.appendChild(wrapper);
    
    // Add click listener to the new button
    wrapper.addEventListener('click', e => {
      console.log('New button clicked', wrapper);
      this.selectedControl = wrapper;
      
      // Force panel to be visible
      this.controlOptionsPanel.style.display = 'flex';
      // Use setTimeout to ensure the display change takes effect before removing 'hidden'
      setTimeout(() => {
        this.controlOptionsPanel.classList.remove('hidden');
      }, 10);
      
      e.stopPropagation(); // Prevent bubbling
    });
    wrapper.setAttribute('data-has-click-listener', 'true');

    const cfg = getConfig();
    const portrait = cfg.representations.iphone.edgeToEdge.portrait;
    if (type === 'thumbstick') {
      const file = this.buttonOverlay.thumbstickImage.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        el.style.backgroundImage = `url(${reader.result})`;
        updateConfig({ representations: cfg.representations });
      };
      if (file) reader.readAsDataURL(file);
    } else if (type === 'dpad') {
      portrait.items.push({
        inputs: { up: "up", down: "down", left: "left", right: "right" },
        frame: { x, y, width: w, height: h },
        extendedEdges: { top, bottom, left, right }
      });
      updateConfig({ representations: cfg.representations });
    } else {
      portrait.items.push({ inputs: [type], frame: { x, y, width: w, height: h }, extendedEdges: { top, bottom, left, right } });
      updateConfig({ representations: cfg.representations });
    }

    this.overlays.addControl.style.display = 'none';
    this.buttonOverlay.thumbstickOptions.style.display = 'none';
  }

  onSaveSettings() {
    updateConfig({
      name: this.settingsFields.name.value,
      identifier: this.settingsFields.identifier.value
    });
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
    }
    this.overlays[key].style.display = 'flex';
    this.contextMenu.classList.remove('open');
  }


  renderConfig() {
    this.renderCode();
  }

  renderCode() {
    const cfg = getConfig();
    const exportCfg = JSON.parse(JSON.stringify(cfg));
    const portrait = exportCfg.representations?.iphone?.edgeToEdge?.portrait;
    if (portrait) portrait.items.forEach(item => { if (item.thumbstick) delete item.thumbstick.data; });
    this.codeContent.textContent = JSON.stringify(exportCfg, null, 2);
  }

  resetScreen() {
    this.screen.style.width = '100%';
    this.screen.style.height = '100%';
    this.screenMessage.style.display = 'block';
    this.logicalDisplay.container.style.display = 'none';
    this.addButton.classList.add('disabled');
  }

  // Control options handlers
  onMoveControl() {
    if (!this.selectedControl) return;
    
    // Set a flag to indicate we're in move mode
    this.selectedControl.classList.add('moving');
    
    // Store initial position
    const initialX = parseInt(this.selectedControl.style.left) || 0;
    const initialY = parseInt(this.selectedControl.style.top) || 0;
    
    // Store initial mouse position
    let startX, startY;
    
    const onMouseDown = (e) => {
      // Get initial mouse position
      startX = e.clientX;
      startY = e.clientY;
      
      // Add event listeners for mouse movement and release
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      
      // Prevent default behavior
      e.preventDefault();
    };
    
    const onMouseMove = (e) => {
      if (!this.selectedControl.classList.contains('moving')) return;
      
      // Calculate new position
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Update position
      this.selectedControl.style.left = `${initialX + deltaX}px`;
      this.selectedControl.style.top = `${initialY + deltaY}px`;
    };
    
    const onMouseUp = () => {
      // Remove moving class
      this.selectedControl.classList.remove('moving');
      
      // Remove event listeners
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // Update config with new position
      this.updateControlPosition();
    };
    
    // Add mousedown event listener to the control
    this.selectedControl.addEventListener('mousedown', onMouseDown);
    
    // // Show message to user
    // const message = document.createElement('div');
    // message.className = 'move-message';
    // message.textContent = 'Click and drag to move the button';
    // message.style.position = 'absolute';
    // message.style.top = '-30px';
    // message.style.left = '0';
    // message.style.width = '100%';
    // message.style.textAlign = 'center';
    // message.style.color = '#fff';
    // message.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    // message.style.padding = '5px';
    // message.style.borderRadius = '3px';
    // message.style.zIndex = '1000';
    
    // this.selectedControl.appendChild(message);
    
    // // Remove message after 3 seconds
    // setTimeout(() => {
    //   if (message.parentNode) {
    //     message.parentNode.removeChild(message);
    //   }
    // }, 3000);
  }
  
  updateControlPosition() {
    if (!this.selectedControl) return;
    
    const controlElement = this.selectedControl.querySelector('.control-element');
    const type = this.selectedControl.dataset.type;
    const instance = this.selectedControl.dataset.instance;
    
    // Get the new position
    const left = parseInt(this.selectedControl.style.left) || 0;
    const top = parseInt(this.selectedControl.style.top) || 0;
    
    // Get extended edges
    const extendedEdgesStr = controlElement.dataset.extendedEdges;
    const extendedEdges = extendedEdgesStr ? JSON.parse(extendedEdgesStr) : { top: 0, bottom: 0, left: 0, right: 0 };
    
    // Calculate actual position (accounting for extended edges)
    const x = left + extendedEdges.left;
    const y = top + extendedEdges.top;
    
    // Update config
    const cfg = getConfig();
    const portrait = cfg.representations.iphone.edgeToEdge.portrait;
    
    // Find and update the item in the config
    const itemIndex = portrait.items.findIndex(item => 
      item.inputs && item.inputs.includes(type) && 
      item.frame.x === parseInt(controlElement.style.left) + left &&
      item.frame.y === parseInt(controlElement.style.top) + top
    );
    
    if (itemIndex !== -1) {
      portrait.items[itemIndex].frame.x = x;
      portrait.items[itemIndex].frame.y = y;
      updateConfig({ representations: cfg.representations });
    }
    
    // Keep the control options panel visible
    console.log('Button moved to position:', x, y);
  }

  onEditControl() {
    if (!this.selectedControl) return;
    
    // Get the control element and its data
    const controlElement = this.selectedControl.querySelector('.control-element');
    const type = this.selectedControl.dataset.type;
    
    // Get position and size
    const left = parseInt(this.selectedControl.style.left) || 0;
    const top = parseInt(this.selectedControl.style.top) || 0;
    const width = parseInt(controlElement.style.width) || 0;
    const height = parseInt(controlElement.style.height) || 0;
    
    // Get extended edges
    const extendedEdgesStr = controlElement.dataset.extendedEdges;
    const extendedEdges = extendedEdgesStr ? JSON.parse(extendedEdgesStr) : { top: 0, bottom: 0, left: 0, right: 0 };
    
    // Calculate actual position (accounting for extended edges)
    const x = left + extendedEdges.left;
    const y = top + extendedEdges.top;
    
    // Populate the add control overlay with the button's values
    this.buttonOverlay.typeSelect.value = type;
    this.buttonOverlay.xInput.value = x;
    this.buttonOverlay.yInput.value = y;
    this.buttonOverlay.widthInput.value = width;
    this.buttonOverlay.heightInput.value = height;
    this.buttonOverlay.extendedEdgeTopInput.value = extendedEdges.top;
    this.buttonOverlay.extendedEdgeBottomInput.value = extendedEdges.bottom;
    this.buttonOverlay.extendedEdgeLeftInput.value = extendedEdges.left;
    this.buttonOverlay.extendedEdgeRightInput.value = extendedEdges.right;
    
    // Show thumbstick options if needed
    if (type === 'thumbstick') {
      this.buttonOverlay.thumbstickOptions.style.display = 'block';
    } else {
      this.buttonOverlay.thumbstickOptions.style.display = 'none';
    }
    
    // Show the add control overlay
    this.overlays.addControl.style.display = 'flex';
    
    // Store edit state for confirmBtn
    this.isEditing = true;
    this.editingControlId = this.selectedControl.id;
    this.buttonOverlay.confirmBtn.dataset.editingId = this.selectedControl.id;

    // Hide the control options panel
    this.controlOptionsPanel.classList.add('hidden');

    // Modify the confirm button text to indicate editing
    this.buttonOverlay.confirmBtn.textContent = 'Update Button';
  }
  
  onUpdateControl(controlId) {
    const control = document.getElementById(controlId);
    if (!control) return;
    
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
    
    // Update the control element
    const controlElement = control.querySelector('.control-element');
    controlElement.innerHTML = `<span>${type}</span>`;
    controlElement.style.width = `${w}px`;
    controlElement.style.height = `${h}px`;
    controlElement.style.left = `${left}px`;
    controlElement.style.top = `${top}px`;
    controlElement.dataset.extendedEdges = JSON.stringify({ top, bottom, left, right });
    
    // Update the wrapper
    control.style.left = `${x - left}px`;
    control.style.top = `${y - top}px`;
    control.style.width = `${w + left + right}px`;
    control.style.height = `${h + top + bottom}px`;
    control.dataset.type = type;
    
    // Update the config
    const cfg = getConfig();
    const portrait = cfg.representations.iphone.edgeToEdge.portrait;
    
    // Find and update the item in the config
    const oldType = control.dataset.type;
    const itemIndex = portrait.items.findIndex(item => 
      item.inputs && item.inputs.includes(oldType)
    );
    
    if (itemIndex !== -1) {
      portrait.items[itemIndex] = {
        inputs: type === 'dpad'
          ? { up: "up", down: "down", left: "left", right: "right" }
          : [type],
        frame: { x, y, width: w, height: h },
        extendedEdges: { top, bottom, left, right }
      };
      updateConfig({ representations: cfg.representations });
    }
    
    // Handle thumbstick image if needed
    if (type === 'thumbstick') {
      const file = this.buttonOverlay.thumbstickImage.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          controlElement.style.backgroundImage = `url(${reader.result})`;
          updateConfig({ representations: cfg.representations });
        };
        reader.readAsDataURL(file);
      }
    }
    
    // Close the overlay
    this.overlays.addControl.style.display = 'none';
  }

  onDeleteControl() {
    if (this.selectedControl) {
      // Get the control type and remove from config
      const type = this.selectedControl.dataset.type;
      const cfg = getConfig();
      const portrait = cfg.representations.iphone.edgeToEdge.portrait;
      
      // Find and remove the item from the config
      const itemIndex = portrait.items.findIndex(item => 
        item.inputs && item.inputs.includes(type)
      );
      
      if (itemIndex !== -1) {
        portrait.items.splice(itemIndex, 1);
        updateConfig({ representations: cfg.representations });
      }
      
      // Remove the element from the DOM
      this.selectedControl.remove();
      this.selectedControl = null;
      this.controlOptionsPanel.classList.add('hidden');
    }
  }
}

export default UIService;
