// js/filters.js

const FILTERS = {
    // 1) Invert
    invert: {
      name: 'Invert',
      emoji: '🔃',
      defaultConfig: { type: 'invert', invertStrength: 1.0 },
      apply: function(imageData, config) {
        const data = imageData.data;
        const invertStrength = config.invertStrength ?? 1;
        for (let i = 0; i < data.length; i += 4) {
          data[i]   = (255 - data[i])   * invertStrength + data[i] * (1 - invertStrength);
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
  
    // 2) Grayscale
    grayscale: {
      name: 'Grayscale',
      emoji: '⚫️',
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
  
    // 3) Psychedelic Color Fade
    colorFade: {
      name: 'Color Fade',
      emoji: '🌈',
      defaultConfig: { type: 'colorFade', speed: 0.05, phase: 0 },
      apply: function(imageData, config) {
        const data = imageData.data;
        config.phase += config.speed;
        const phaseR = config.phase * 1.0;
        const phaseG = config.phase * 1.3;
        const phaseB = config.phase * 1.6;
  
        for (let i = 0; i < data.length; i += 4) {
          data[i]   = data[i]   * (0.5 + 0.5 * Math.sin(phaseR));
          data[i+1] = data[i+1] * (0.5 + 0.5 * Math.sin(phaseG));
          data[i+2] = data[i+2] * (0.5 + 0.5 * Math.sin(phaseB));
        }
      },
      renderParamUI: function(container, config) {
        container.innerHTML = '';
        const label = document.createElement('label');
        label.textContent = 'Speed (0 = still, higher = faster):';
  
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 0.5;
        slider.step = 0.01;
        slider.value = config.speed;
  
        slider.addEventListener('input', () => {
          config.speed = parseFloat(slider.value);
        });
  
        container.appendChild(label);
        container.appendChild(document.createElement('br'));
        container.appendChild(slider);
      }
    },
  
    // 4) Pixelate
    pixelate: {
      name: 'Pixelate',
      emoji: '🔲',
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
  
    // 5) Blur
    blur: {
      name: 'Blur',
      emoji: '💧',
      defaultConfig: { type: 'blur', intensity: 1 },
      apply: function(imageData, config) {
        const radius = config.intensity || 1;
        const w = imageData.width;
        const h = imageData.height;
        const data = imageData.data;
        const copy = new Uint8ClampedArray(data);
  
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            let sumR = 0, sumG = 0, sumB = 0, count = 0;
            for (let ky = -radius; ky <= radius; ky++) {
              for (let kx = -radius; kx <= radius; kx++) {
                const nx = x + kx;
                const ny = y + ky;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                  const idx = (ny * w + nx) * 4;
                  sumR += copy[idx + 0];
                  sumG += copy[idx + 1];
                  sumB += copy[idx + 2];
                  count++;
                }
              }
            }
            const idx = (y * w + x) * 4;
            data[idx + 0] = sumR / count;
            data[idx + 1] = sumG / count;
            data[idx + 2] = sumB / count;
          }
        }
      },
      renderParamUI: function(container, config) {
        container.innerHTML = '';
        const label = document.createElement('label');
        label.textContent = 'Blur Intensity (Radius):';
  
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 1;
        slider.max = 10;
        slider.step = 1;
        slider.value = config.intensity;
  
        slider.addEventListener('input', () => {
          config.intensity = parseInt(slider.value, 10);
        });
  
        container.appendChild(label);
        container.appendChild(document.createElement('br'));
        container.appendChild(slider);
      }
    },
  
    // 6) Swirl
    swirl: {
      name: 'Swirl',
      emoji: '🌀',
      defaultConfig: { type: 'swirl', radius: 100, angle: 1.0 },
      apply: function(imageData, config) {
        const radius = config.radius ?? 100;
        const angle = config.angle ?? 1.0;
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
            const dist = Math.sqrt(dx * dx + dy * dy);
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
        radiusLabel.textContent = 'Swirl Radius:';
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
        angleLabel.textContent = 'Swirl Angle:';
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
  
    // 7) Comic Book
    comicBook: {
      name: 'Comic Book',
      emoji: '📕',
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
    }
  };
  