// js/puzzles.js

/********************************************************
 * Config
********************************************************/
const imagesList = [
  "images/background_logo.png"
  // etc. Make sure these actually exist in /images
];

const maxFilters = 3;

/********************************************************
 * Variables
********************************************************/
let secretFilters = []; // The "secret" combo for the puzzle
let puzzleImage = null; // The current input image
let puzzleFilters = [null, null, null, null]; // user-chosen filters

// For param editing (modal):
let currentSlotIndex = null; // which slot user is editing

/********************************************************
 * On load => build UI, set up
********************************************************/
window.addEventListener('DOMContentLoaded', () => {
  buildPuzzleFilterBank();
  setupPuzzleSlots();

  // Buttons
  document.getElementById('newPuzzleBtn').addEventListener('click', newPuzzle);
  document.getElementById('newImageBtn').addEventListener('click', seeItOnNewImage);

  // Param Modal close
  document.getElementById('closeParams').addEventListener('click', () => {
    document.getElementById('paramModal').style.display = 'none';
  });

  // Document-level dragover => let user drop anywhere
  document.addEventListener('dragover', e => {
    e.preventDefault();
  });

  // Document-level drop => check if user dragged off a slot
  document.addEventListener('drop', e => {
    const source = e.dataTransfer.getData('text/source');
    const oldSlotIndex = e.dataTransfer.getData('text/slotIndex');
    if (source === 'slot' && oldSlotIndex != null) {
      const dropTarget = e.target;
      // If there's no slot in the ancestry => user dropped outside
      if (!dropTarget.closest('.slot')) {
        // remove that slot's filter
        puzzleFilters[oldSlotIndex] = null;

        const oldSlotElem = document.querySelector(`.slot[data-slot="${oldSlotIndex}"]`);
        oldSlotElem.textContent = '';
        oldSlotElem.classList.remove('active');
        oldSlotElem.setAttribute('draggable', 'false');

        // re-apply filters after removing
        applyUserFilters();
      }
    }
  });

  // Start the first puzzle
  newPuzzle();
});

/********************************************************
 * newPuzzle():
 * 1) pick random image
 * 2) pick random subset of filters => secret combo
 * 3) display them
********************************************************/
function newPuzzle() {
  // Clear user-chosen filters
  puzzleFilters = [null, null, null, null];
  clearSlots();

  // Reset score
  document.getElementById('scoreMessage').textContent = 'Match Score: 0%';

  // Pick random image
  puzzleImage = randomPick(imagesList);

  // Pick random subset of filters
  const allKeys = Object.keys(FILTERS);
  const numFilters = 1 + Math.floor(Math.random() * maxFilters);
  const chosenKeys = shuffleArray(allKeys).slice(0, numFilters);

  // Build the "secretFilters" array
  secretFilters = chosenKeys.map(k => JSON.parse(JSON.stringify(FILTERS[k].defaultConfig)));

  // Generate the target image
  generateTargetImage(puzzleImage, secretFilters).then(dataURL => {
    document.getElementById('targetImage').src = dataURL;
  });

  // Show input image
  document.getElementById('inputImage').src = puzzleImage;

  // Render "your image" with no filters
  applyUserFilters();
}

/********************************************************
 * seeItOnNewImage():
 * same puzzle filters, new random input
********************************************************/
function seeItOnNewImage() {
  puzzleImage = randomPick(imagesList);

  // Re-generate the target for that same secret combo
  generateTargetImage(puzzleImage, secretFilters).then(dataURL => {
    document.getElementById('targetImage').src = dataURL;
  });

  document.getElementById('inputImage').src = puzzleImage;
  applyUserFilters();
}

/********************************************************
 * generateTargetImage(imgSrc, filterList):
 * draws the image, applies filterList, returns dataURL
********************************************************/
function generateTargetImage(imgSrc, filterList) {
  return new Promise(resolve => {
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const cx = c.getContext('2d');

      cx.drawImage(img, 0, 0);
      let frame = cx.getImageData(0, 0, c.width, c.height);

      // apply secret filters in order
      filterList.forEach(conf => {
        const def = FILTERS[conf.type];
        if (def && def.apply) {
          def.apply(frame, conf);
        }
      });

      cx.putImageData(frame, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
  });
}

/********************************************************
 * buildPuzzleFilterBank():
 * Create the filter emojis
********************************************************/
function buildPuzzleFilterBank() {
  const filterBank = document.getElementById('filter-bank');
  filterBank.innerHTML = '';

  Object.keys(FILTERS).forEach(k => {
    const fDef = FILTERS[k];
    const span = document.createElement('span');
    span.classList.add('filter-emoji');
    span.setAttribute('draggable', 'true');
    span.dataset.filterKey = k;
    span.textContent = fDef.emoji;
    span.title = fDef.name;

    // dragstart => store filter info
    span.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/filterKey', k);
      e.dataTransfer.setData('text/emoji', span.textContent);
      e.dataTransfer.setData('text/source', 'bank');
    });

    filterBank.appendChild(span);
  });
}

/********************************************************
 * setupPuzzleSlots():
 * - drag & drop logic
 * - click => param editor
********************************************************/
function setupPuzzleSlots() {
  const slots = document.querySelectorAll('.slot');
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
        puzzleFilters[newSlotIndex] = puzzleFilters[oldSlotIndex];
        puzzleFilters[oldSlotIndex] = null;

        slot.textContent = e.dataTransfer.getData('text/emoji');
        slot.classList.add('active');
        slot.setAttribute('draggable', 'true');

        const oldSlotElem = document.querySelector(`.slot[data-slot="${oldSlotIndex}"]`);
        oldSlotElem.textContent = '';
        oldSlotElem.classList.remove('active');
        oldSlotElem.setAttribute('draggable', 'false');

      } else if (source === 'bank') {
        // from filter bank => new slot
        const fDef = FILTERS[filterKey];
        if (!fDef) return;

        slot.textContent = fDef.emoji;
        slot.classList.add('active');
        slot.setAttribute('draggable', 'true');

        puzzleFilters[newSlotIndex] = JSON.parse(JSON.stringify(fDef.defaultConfig));
      }

      applyUserFilters();
    });

    slot.addEventListener('dragstart', e => {
      const i = slot.dataset.slot;
      const conf = puzzleFilters[i];
      if (!conf) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('text/filterKey', conf.type);
      e.dataTransfer.setData('text/emoji', slot.textContent);
      e.dataTransfer.setData('text/source', 'slot');
      e.dataTransfer.setData('text/slotIndex', i);
    });

    // Click => open param editor if filter is present
    slot.addEventListener('click', () => {
      const i = slot.dataset.slot;
      const conf = puzzleFilters[i];
      if (!conf) return; // no filter => no param editor

      currentSlotIndex = i;
      showParamModal(conf);
    });
  });
}

/********************************************************
 * showParamModal(conf):
 * - generate param UI
 * - re-apply filters on slider input
********************************************************/
function showParamModal(filterConfig) {
  const paramModal = document.getElementById('paramModal');
  const filterParamsDiv = document.getElementById('filterParams');

  // Clear old UI
  filterParamsDiv.innerHTML = '';

  // The filterDef might have a renderParamUI that sets up sliders, etc.
  const def = FILTERS[filterConfig.type];
  if (def && def.renderParamUI) {
    def.renderParamUI(filterParamsDiv, filterConfig);
  }

  // Make sure param changes immediately update "Your Image"
  paramModal.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.addEventListener('input', () => {
      applyUserFilters();
    });
  });

  paramModal.style.display = 'block';
}

/********************************************************
 * applyUserFilters():
 * draws puzzleImage => resultCanvas => apply puzzleFilters
********************************************************/
function applyUserFilters() {
  if (!puzzleImage) return;
  const resultCanvas = document.getElementById('resultCanvas');
  const rcx = resultCanvas.getContext('2d');

  const img = new Image();
  img.src = puzzleImage;
  img.onload = () => {
    // We'll set the canvas to the image's *natural* size
    resultCanvas.width = img.width;
    resultCanvas.height = img.height;

    // Then CSS is limiting the displayed size to ~200px, so it looks smaller but keeps clarity
    rcx.drawImage(img, 0, 0);

    // Apply each chosen filter
    let frame = rcx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
    puzzleFilters.forEach(conf => {
      if (conf) {
        const fDef = FILTERS[conf.type];
        if (fDef && fDef.apply) {
          fDef.apply(frame, conf);
        }
      }
    });
    rcx.putImageData(frame, 0, 0);

    // Compare with target => show score
    compareAndScore(frame);
  };
}

/********************************************************
 * compareAndScore(userFrame):
 * We'll generate the "secret" image at the same resolution,
 * then compare pixel by pixel
********************************************************/
async function compareAndScore(userFrame) {
  const w = userFrame.width;
  const h = userFrame.height;

  const scoreElem = document.getElementById('scoreMessage');
  const targetFrame = await generateTargetFrame(puzzleImage, secretFilters, w, h);

  if (!targetFrame || targetFrame.width !== w || targetFrame.height !== h) {
    scoreElem.textContent = "Size mismatch—cannot compare.";
    return;
  }

  const userData = userFrame.data;
  const targetData = targetFrame.data;
  let sameCount = 0;
  for (let i = 0; i < userData.length; i++) {
    if (Math.abs(userData[i] - targetData[i]) < 5) {
      sameCount++;
    }
  }
  const ratio = sameCount / userData.length;
  const pct = (ratio * 100).toFixed(1);
  scoreElem.textContent = `Match Score: ${pct}%`;
}

/********************************************************
 * generateTargetFrame(imgSrc, filters, w, h):
 * draws original at full resolution => scaled to w/h => apply filters
 * returns an ImageData so we can compare
********************************************************/
function generateTargetFrame(imgSrc, filters, w, h) {
  return new Promise(resolve => {
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const cx = c.getContext('2d');

      // scale the image into w,h
      cx.drawImage(img, 0, 0, w, h);

      let frame = cx.getImageData(0, 0, w, h);
      filters.forEach(conf => {
        const fDef = FILTERS[conf.type];
        if (fDef && fDef.apply) {
          fDef.apply(frame, conf);
        }
      });
      resolve(frame);
    };
  });
}

/********************************************************
 * HELPER: clearSlots()
********************************************************/
function clearSlots() {
  const slots = document.querySelectorAll('.slot');
  slots.forEach(s => {
    s.textContent = '';
    s.classList.remove('active');
    s.setAttribute('draggable', 'false');
  });
}

/********************************************************
 * HELPER: randomPick(arr)
********************************************************/
function randomPick(arr) {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

/********************************************************
 * HELPER: shuffleArray(arr)
********************************************************/
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
