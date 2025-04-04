// js/filters.js

const FILTERS = {
  // 1) Invert (🔃)
  invert: {
    name: 'Invert',
    emoji: '🔃',
    defaultConfig: { type: 'invert', invertStrength: 1.0 },
    apply: function(imageData, config) {
      const data = imageData.data;
      const invertStrength = config.invertStrength ?? 1;
      for (let i = 0; i < data.length; i += 4) {
        data[i]   = (255 - data[i])   * invertStrength + data[i]   * (1 - invertStrength);
        data[i+1] = (255 - data[i+1]) * invertStrength + data[i+1] * (1 - invertStrength);
        data[i+2] = (255 - data[i+2]) * invertStrength + data[i+2] * (1 - invertStrength);
      }
    },
    renderParamUI: function(container, config) {
      container.innerHTML = '';
      const label = document.createElement('label');
      label.textContent = 'Invert Strength:';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = 0;
      slider.max = 1;
      slider.step = 0.01;
      slider.value = config.invertStrength;

      slider.addEventListener('input', () => {
        config.invertStrength = parseFloat(slider.value);
      });

      container.appendChild(label);
      container.appendChild(document.createElement('br'));
      container.appendChild(slider);
    }
  },

  // 2) Grayscale (⬜️)
  grayscale: {
    name: 'Grayscale',
    emoji: '⬜️',
    defaultConfig: { type: 'grayscale' },
    apply: function(imageData, config) {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        let avg = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        data[i]   = avg;
        data[i+1] = avg;
        data[i+2] = avg;
      }
    },
    renderParamUI: function(container, config) {
      container.innerHTML = '<p>No adjustable parameters.</p>';
    }
  },

  // 3) No Red (🚫🟥) - sets the red channel to 0
  noRed: {
    name: 'No Red',
    emoji: '🚫🟥',
    defaultConfig: { type: 'noRed' },
    apply: function(imageData, config) {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 0; // remove red
      }
    },
    renderParamUI: function(container, config) {
      container.innerHTML = '<p>No parameters.</p>';
    }
  },

  // 4) No Green (🚫🟩)
  noGreen: {
    name: 'No Green',
    emoji: '🚫🟩',
    defaultConfig: { type: 'noGreen' },
    apply: function(imageData, config) {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i+1] = 0; // remove green
      }
    },
    renderParamUI: function(container, config) {
      container.innerHTML = '<p>No parameters.</p>';
    }
  },

  // 5) No Blue (🚫🟦)
  noBlue: {
    name: 'No Blue',
    emoji: '🚫🟦',
    defaultConfig: { type: 'noBlue' },
    apply: function(imageData, config) {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i+2] = 0; // remove blue
      }
    },
    renderParamUI: function(container, config) {
      container.innerHTML = '<p>No parameters.</p>';
    }
  },

  // 6) Comic Book (🦸)
  comicBook: {
    name: 'Comic Book',
    emoji: '🦸',
    defaultConfig: { type: 'comicBook' },
    apply: function(imageData, config) {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i + 0] = quantize(data[i + 0]);
        data[i + 1] = quantize(data[i + 1]);
        data[i + 2] = quantize(data[i + 2]);
      }

      function quantize(value) {
        if (value < 85) return 0;
        else if (value < 170) return 128;
        else return 255;
      }
    },
    renderParamUI: function(container, config) {
      container.innerHTML = '<p>No adjustable parameters.</p>';
    }
  },

  // 7) Pixelate (👾)
  pixelate: {
    name: 'Pixelate',
    emoji: '👾',
    defaultConfig: { type: 'pixelate', pixelSize: 8 },
    apply: function(imageData, config) {
      const w = imageData.width;
      const h = imageData.height;
      const data = imageData.data;
      const pixelSize = config.pixelSize || 8;
      const copy = new Uint8ClampedArray(data);

      for (let y = 0; y < h; y += pixelSize) {
        for (let x = 0; x < w; x += pixelSize) {
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          for (let yy = 0; yy < pixelSize; yy++) {
            for (let xx = 0; xx < pixelSize; xx++) {
              const ny = y + yy;
              const nx = x + xx;
              if (nx < w && ny < h) {
                const idx = (ny * w + nx) * 4;
                sumR += copy[idx + 0];
                sumG += copy[idx + 1];
                sumB += copy[idx + 2];
                count++;
              }
            }
          }
          const avgR = sumR / count;
          const avgG = sumG / count;
          const avgB = sumB / count;
          for (let yy = 0; yy < pixelSize; yy++) {
            for (let xx = 0; xx < pixelSize; xx++) {
              const ny = y + yy;
              const nx = x + xx;
              if (nx < w && ny < h) {
                const idx = (ny * w + nx) * 4;
                data[idx + 0] = avgR;
                data[idx + 1] = avgG;
                data[idx + 2] = avgB;
              }
            }
          }
        }
      }
    },
    renderParamUI: function(container, config) {
      container.innerHTML = '';
      const label = document.createElement('label');
      label.textContent = 'Pixel Size:';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = 1;
      slider.max = 50;
      slider.step = 1;
      slider.value = config.pixelSize;

      slider.addEventListener('input', () => {
        config.pixelSize = parseInt(slider.value, 10);
      });

      container.appendChild(label);
      container.appendChild(document.createElement('br'));
      container.appendChild(slider);
    }
  },

  // 8) Spiral (🌀) (renamed swirl) with bigger defaults
  spiral: {
    name: 'Spiral',
    emoji: '🌀',
    defaultConfig: { type: 'spiral', radius: 150, angle: 2.0 },
    apply: function(imageData, config) {
      const radius = config.radius ?? 150;
      const angle = config.angle ?? 2.0;
      const w = imageData.width;
      const h = imageData.height;
      const data = imageData.data;
      const copy = new Uint8ClampedArray(data);
      const cx = w / 2;
      const cy = h / 2;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < radius) {
            const swirlFactor = (radius - dist) / radius * angle;
            const theta = Math.atan2(dy, dx) + swirlFactor;
            const srcX = Math.floor(cx + dist * Math.cos(theta));
            const srcY = Math.floor(cy + dist * Math.sin(theta));
            if (srcX >= 0 && srcX < w && srcY >= 0 && srcY < h) {
              const srcIdx = (srcY * w + srcX) * 4;
              const dstIdx = (y * w + x) * 4;
              data[dstIdx + 0] = copy[srcIdx + 0];
              data[dstIdx + 1] = copy[srcIdx + 1];
              data[dstIdx + 2] = copy[srcIdx + 2];
              data[dstIdx + 3] = copy[srcIdx + 3];
            }
          }
        }
      }
    },
    renderParamUI: function(container, config) {
      container.innerHTML = '';

      const radiusLabel = document.createElement('label');
      radiusLabel.textContent = 'Spiral Radius:';
      const radiusSlider = document.createElement('input');
      radiusSlider.type = 'range';
      radiusSlider.min = 0;
      radiusSlider.max = 300;
      radiusSlider.step = 1;
      radiusSlider.value = config.radius;
      radiusSlider.addEventListener('input', () => {
        config.radius = parseInt(radiusSlider.value, 10);
      });

      container.appendChild(radiusLabel);
      container.appendChild(document.createElement('br'));
      container.appendChild(radiusSlider);
      container.appendChild(document.createElement('br'));

      const angleLabel = document.createElement('label');
      angleLabel.textContent = 'Spiral Angle:';
      const angleSlider = document.createElement('input');
      angleSlider.type = 'range';
      angleSlider.min = -5;
      angleSlider.max = 5;
      angleSlider.step = 0.1;
      angleSlider.value = config.angle;
      angleSlider.addEventListener('input', () => {
        config.angle = parseFloat(angleSlider.value);
      });

      container.appendChild(angleLabel);
      container.appendChild(document.createElement('br'));
      container.appendChild(angleSlider);
    }
  },

  // 9) Mirror (🪞) - Mirror left side onto right side
  mirror: {
    name: 'Mirror',
    emoji: '🪞',
    defaultConfig: { type: 'mirror' },
    apply: function(imageData, config) {
      const w = imageData.width;
      const h = imageData.height;
      const data = imageData.data;

      // We'll copy the left half to the right half
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w / 2; x++) {
          const leftIdx = (y * w + x) * 4;
          const rightIdx = (y * w + (w - 1 - x)) * 4;

          // data[rightIdx..rightIdx+3] = data[leftIdx..leftIdx+3]
          data[rightIdx + 0] = data[leftIdx + 0];
          data[rightIdx + 1] = data[leftIdx + 1];
          data[rightIdx + 2] = data[leftIdx + 2];
          data[rightIdx + 3] = data[leftIdx + 3];
        }
      }
    },
    renderParamUI: function(container, config) {
      container.innerHTML = '<p>No adjustable parameters.</p>';
    }
  },

  // 10) Edge Detect (🫥) - basic threshold with Sobel or a simple approach
  edgeDetect: {
    name: 'Edge Detect',
    emoji: '🫥',
    defaultConfig: { type: 'edgeDetect', threshold: 50 },
    apply: function(imageData, config) {
      // We'll do a simple "Sobel" approach 
      // and turn edges black, background white, or vice versa
      const threshold = config.threshold ?? 50;

      const w = imageData.width;
      const h = imageData.height;
      const data = imageData.data;
      const gray = new Uint8ClampedArray(data.length);

      // Convert to grayscale first
      for (let i = 0; i < data.length; i += 4) {
        let avg = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        gray[i]   = avg;
        gray[i+1] = avg;
        gray[i+2] = avg;
        gray[i+3] = 255;
      }

      // Create a copy for the result
      const result = new Uint8ClampedArray(data.length);

      // Sobel convolution
      const gxKernel = [[-1,0,1],[-2,0,2],[-1,0,1]];
      const gyKernel = [[-1,-2,-1],[0,0,0],[1,2,1]];

      for (let y = 1; y < h-1; y++) {
        for (let x = 1; x < w-1; x++) {
          let gx = 0;
          let gy = 0;

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const px = x + kx;
              const py_ = y + ky;
              const idx = (py_ * w + px) * 4; // grayscale => look at, say, gray[idx]
              const intensity = gray[idx]; // from the R channel, e.g. 
              gx += intensity * gxKernel[ky+1][kx+1];
              gy += intensity * gyKernel[ky+1][kx+1];
            }
          }

          const mag = Math.sqrt(gx * gx + gy * gy);
          const outIdx = (y * w + x) * 4;
          if (mag > threshold) {
            // Edge => black
            result[outIdx + 0] = 0;
            result[outIdx + 1] = 0;
            result[outIdx + 2] = 0;
            result[outIdx + 3] = 255;
          } else {
            // Not edge => white
            result[outIdx + 0] = 255;
            result[outIdx + 1] = 255;
            result[outIdx + 2] = 255;
            result[outIdx + 3] = 255;
          }
        }
      }

      // copy border pixels from original for simplicity, or make them white
      // let's just make them white
      // top/bottom rows, left/right cols
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (y === 0 || y === h-1 || x === 0 || x === w-1) {
            const idx = (y * w + x) * 4;
            result[idx + 0] = 255;
            result[idx + 1] = 255;
            result[idx + 2] = 255;
            result[idx + 3] = 255;
          }
        }
      }

      // now put result back into data
      for (let i = 0; i < data.length; i++) {
        data[i] = result[i];
      }
    },
    renderParamUI: function(container, config) {
      container.innerHTML = '';

      const label = document.createElement('label');
      label.textContent = 'Edge Threshold:';
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = 0;
      slider.max = 255;
      slider.step = 1;
      slider.value = config.threshold ?? 50;
      slider.addEventListener('input', () => {
        config.threshold = parseInt(slider.value, 10);
      });

      container.appendChild(label);
      container.appendChild(document.createElement('br'));
      container.appendChild(slider);
    }
  }

};

// Just exporting if needed (ES modules) or using globally is fine
// export default FILTERS;
