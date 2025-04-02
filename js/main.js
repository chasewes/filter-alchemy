// js/main.js

// We'll store the active filters in an array with up to 4 items
const activeFilters = [null, null, null, null];

// DOM elements
const video = document.getElementById('video');
const outputCanvas = document.getElementById('outputCanvas');
const ctx = outputCanvas.getContext('2d');

const filterBank = document.getElementById('filter-bank');
const slots = document.querySelectorAll('.slot');

const paramModal = document.getElementById('paramModal');
const filterParamsDiv = document.getElementById('filterParams');
const closeParamsBtn = document.getElementById('closeParams');

let currentSlotIndex = null;

// Build the filter bank from FILTERS
Object.keys(FILTERS).forEach(key => {
  const filterDef = FILTERS[key];
  const span = document.createElement('span');
  span.classList.add('filter-emoji');
  span.setAttribute('draggable', 'true');
  span.dataset.filterKey = key;
  span.textContent = filterDef.emoji;
  span.title = filterDef.name;

  span.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/filterKey', key);
    e.dataTransfer.setData('text/emoji', span.textContent);
    e.dataTransfer.setData('text/source', 'bank');
  });

  filterBank.appendChild(span);
});

// Set up drag-and-drop for the slots
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
      // Move from old slot to new
      activeFilters[newSlotIndex] = activeFilters[oldSlotIndex];
      activeFilters[oldSlotIndex] = null;

      slot.textContent = e.dataTransfer.getData('text/emoji');
      slot.classList.add('active');
      slot.setAttribute('draggable', 'true');

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

      if (!activeFilters[newSlotIndex] || activeFilters[newSlotIndex].type !== filterKey) {
        activeFilters[newSlotIndex] = JSON.parse(JSON.stringify(filterDef.defaultConfig));
      }
    }
  });

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

  slot.addEventListener('click', () => {
    const slotIndex = slot.dataset.slot;
    const config = activeFilters[slotIndex];
    if (!config) return;

    currentSlotIndex = slotIndex;
    showParamModal(config);
  });
});

// Remove filter if dropped outside a slot
document.addEventListener('dragover', e => {
  e.preventDefault();
});

document.addEventListener('drop', e => {
  const source = e.dataTransfer.getData('text/source');
  const oldSlotIndex = e.dataTransfer.getData('text/slotIndex');

  if (source === 'slot' && oldSlotIndex != null) {
    const dropTarget = e.target;
    if (!dropTarget.classList.contains('slot')) {
      activeFilters[oldSlotIndex] = null;
      const oldSlotElem = document.querySelector(`.slot[data-slot="${oldSlotIndex}"]`);
      oldSlotElem.textContent = '';
      oldSlotElem.classList.remove('active');
      oldSlotElem.setAttribute('draggable', 'false');
    }
  }
});

// Parameter Modal
function showParamModal(config) {
  filterParamsDiv.innerHTML = '';
  const filterDef = FILTERS[config.type];
  if (filterDef && filterDef.renderParamUI) {
    filterDef.renderParamUI(filterParamsDiv, config);
  }
  paramModal.style.display = 'block';
}

closeParamsBtn.addEventListener('click', () => {
  paramModal.style.display = 'none';
});

// Start the webcam & rendering loop
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

function renderFrame() {
  ctx.save();
  ctx.translate(outputCanvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);
  ctx.restore();

  let frame = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);

  activeFilters.forEach(config => {
    if (config) {
      const filterDef = FILTERS[config.type];
      if (filterDef && filterDef.apply) {
        filterDef.apply(frame, config);
      }
    }
  });

  ctx.putImageData(frame, 0, 0);
  requestAnimationFrame(renderFrame);
}
