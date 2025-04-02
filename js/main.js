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
  // Set data attributes so we can read in drag events
  span.dataset.filterKey = key; 
  span.textContent = filterDef.emoji;
  // Show name on hover
  span.title = filterDef.name;

  // Add dragstart event
  span.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/filterKey', key);
    e.dataTransfer.setData('text/emoji', span.textContent);
    e.dataTransfer.setData('text/source', 'bank');
  });

  filterBank.appendChild(span);
});

// 2) Set up drag-and-drop for the slots
slots.forEach(slot => {
  slot.addEventListener('dragover', e => e.preventDefault());

  slot.addEventListener('drop', e => {
    e.preventDefault();
    const filterKey = e.dataTransfer.getData('text/filterKey');
    const source = e.dataTransfer.getData('text/source');
    const oldSlotIndex = e.dataTransfer.getData('text/slotIndex');
    const newSlotIndex = slot.dataset.slot;

    if (!filterKey || newSlotIndex == null) return;

    if (source === 'slot') {
      // The user is moving a filter from oldSlotIndex to newSlotIndex
      activeFilters[newSlotIndex] = activeFilters[oldSlotIndex];
      activeFilters[oldSlotIndex] = null;

      slot.textContent = e.dataTransfer.getData('text/emoji');
      slot.classList.add('active');
      slot.setAttribute('draggable', 'true');

      // Clear the old slot
      const oldSlotElem = document.querySelector(`.slot[data-slot="${oldSlotIndex}"]`);
      oldSlotElem.textContent = '';
      oldSlotElem.classList.remove('active');
      oldSlotElem.setAttribute('draggable', 'false');

    } else if (source === 'bank') {
      // From filter bank → new slot
      const filterDef = FILTERS[filterKey];
      if (!filterDef) return;

      slot.textContent = filterDef.emoji;
      slot.classList.add('active');
      slot.setAttribute('draggable', 'true');

      // If new filter or different type, set default config
      if (!activeFilters[newSlotIndex] || activeFilters[newSlotIndex].type !== filterKey) {
        activeFilters[newSlotIndex] = JSON.parse(JSON.stringify(filterDef.defaultConfig));
      }
    }
  });

  // Make the slot itself draggable (only if it has a filter)
  slot.addEventListener('dragstart', e => {
    const slotIndex = slot.dataset.slot;
    const filterConfig = activeFilters[slotIndex];
    if (!filterConfig) {
      e.preventDefault();
      return;
    }
    // We store the filterKey & emoji
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

// 3) Trash (remove a slot’s filter)
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
