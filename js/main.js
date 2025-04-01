// js/main.js

// We'll store the active filters in an array with up to 4 items
const activeFilters = [null, null, null, null];

// Dom elements
const video = document.getElementById('video');
const outputCanvas = document.getElementById('outputCanvas');
const ctx = outputCanvas.getContext('2d');

const filterBank = document.getElementById('filter-bank');
const slots = document.querySelectorAll('.slot');
const trash = document.getElementById('trash');

const paramModal = document.getElementById('paramModal');
const filterParamsDiv = document.getElementById('filterParams');
const closeParamsBtn = document.getElementById('closeParams');

let currentSlotIndex = null;

// 1) Build the filter bank from FILTERS
Object.keys(FILTERS).forEach(key => {
    const filterDef = FILTERS[key];
    // Create an emoji span
    const span = document.createElement('span');
    span.classList.add('filter-emoji');
    span.setAttribute('draggable', 'true');
  
    // Set text content to the emoji
    span.textContent = filterDef.emoji;
  
    // Set a native tooltip using the filter's name
    span.title = filterDef.name;
  
    // Add dragstart event, etc.
    span.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/filterKey', key);
      e.dataTransfer.setData('text/source', 'bank');
    });
  
    filterBank.appendChild(span);
  });
  
  slots.forEach(slot => {
    slot.addEventListener('dragover', e => e.preventDefault());
  
    slot.addEventListener('drop', e => {
      e.preventDefault();
  
      // We consistently call it "filterKey"
      const filterKey = e.dataTransfer.getData('text/filterKey');
      const source = e.dataTransfer.getData('text/source');
      const oldSlotIndex = e.dataTransfer.getData('text/slotIndex');
      const newSlotIndex = slot.dataset.slot; // "this" slot
  
      if (source === 'slot') {
        // Moving a filter from an old slot to this new slot
  
        // 1) Move the config
        activeFilters[newSlotIndex] = activeFilters[oldSlotIndex];
        activeFilters[oldSlotIndex] = null;
  
        // 2) Update the new slot’s visuals
        // We also stored the emoji in dataTransfer during dragstart:
        const draggedEmoji = e.dataTransfer.getData('text/emoji');
        slot.textContent = draggedEmoji;
        slot.classList.add('active');
        slot.setAttribute('draggable', 'true');
  
        // 3) Clear the old slot
        const oldSlotElem = document.querySelector(`.slot[data-slot="${oldSlotIndex}"]`);
        oldSlotElem.textContent = '';
        oldSlotElem.classList.remove('active');
        oldSlotElem.setAttribute('draggable', 'false');
  
      } else if (source === 'bank') {
        // User dragged a filter from the filter bank onto this slot
        const filterDef = FILTERS[filterKey];
        if (!filterDef) return; // safety check
  
        slot.textContent = filterDef.emoji;
        slot.classList.add('active');
        slot.setAttribute('draggable', 'true');
  
        // If there's no existing filter in newSlotIndex, or it's a different type, set a fresh config
        if (!activeFilters[newSlotIndex] || activeFilters[newSlotIndex].type !== filterKey) {
          // Clone the default config so each slot has its own instance
          activeFilters[newSlotIndex] = JSON.parse(JSON.stringify(filterDef.defaultConfig));
        }
      }
    });

  // Make slot itself draggable (only if it has an active filter)
  slot.addEventListener('dragstart', e => {
    const slotIndex = slot.dataset.slot;
    const filterConfig = activeFilters[slotIndex];
    if (!filterConfig) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/filterKey', filterConfig.type);
    e.dataTransfer.setData('text/emoji', slot.textContent);
    e.dataTransfer.setData('text/source', 'slot');
    e.dataTransfer.setData('text/slotIndex', slotIndex);
  });  

  // Click to open param editor
  slot.addEventListener('click', () => {
    const slotIndex = slot.dataset.slot;
    const config = activeFilters[slotIndex];
    if (!config) return;

    currentSlotIndex = slotIndex;
    showParamModal(config);
  });
});

// 3) Trash
trash.addEventListener('dragover', e => e.preventDefault());
trash.addEventListener('drop', e => {
  e.preventDefault();
  const slotIndex = e.dataTransfer.getData('text/slotIndex');
  const source = e.dataTransfer.getData('text/source');
  if (source === 'slot' && slotIndex) {
    // Clear that slot
    activeFilters[slotIndex] = null;
    const slotElem = document.querySelector(`.slot[data-slot="${slotIndex}"]`);
    slotElem.textContent = '';
    slotElem.classList.remove('active');
    slotElem.setAttribute('draggable', 'false');
  }
});

// 4) Show parameter modal
function showParamModal(config) {
  // Clear old UI
  filterParamsDiv.innerHTML = '';

  // The config.type is the key in FILTERS
  const filterDef = FILTERS[config.type];
  if (filterDef && filterDef.renderParamUI) {
    filterDef.renderParamUI(filterParamsDiv, config);
  }

  paramModal.style.display = 'block';
}

// Close button for the modal
closeParamsBtn.addEventListener('click', () => {
  paramModal.style.display = 'none';
});

// 5) Get user media & start rendering
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    video.addEventListener('playing', () => {
      renderFrame();
    });
  })
  .catch(err => {
    console.error('Error accessing webcam:', err);
  });

// 6) Render loop
function renderFrame() {
  // Mirror the video if you want a "selfie" style
  ctx.save();
  ctx.translate(outputCanvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);
  ctx.restore();

  // Grab pixels
  let frame = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);

  // Apply each active filter in sequence
  activeFilters.forEach(config => {
    if (config) {
      const filterDef = FILTERS[config.type];
      if (filterDef && filterDef.apply) {
        filterDef.apply(frame, config);
      }
    }
  });

  // Put updated image data back
  ctx.putImageData(frame, 0, 0);

  requestAnimationFrame(renderFrame);
}


