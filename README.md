# Filter Alchemy

Filter Alchemy is a browser-based video filtering puzzle that lets you drag and drop “filter emojis” onto puzzle slots, creating fun real-time effects on your webcam feed. Designed for quick experimentation, it features:

- A **live video feed**
- Multiple **filters** (e.g., invert, grayscale, pixelate, swirl)  
- **Drag-and-drop** controls for reordering or removing filters  
- Parameter sliders for **customizing** each filter's intensity

## 🌐 Try It Live

▶️ **[Launch Filter Alchemy](https://chasewes.github.io/filter-alchemy/)**

## Getting Started

1. Clone or download this repository.  
2. Open `index.html` in a modern browser with a valid HTTPS environment (or `localhost`) so the camera can be accessed.  
3. Grant camera permission when prompted.  
4. Drag filters from the “bank” into the four puzzle slots.  
   - Click a slot to open its parameter editor (if the filter supports custom parameters).  
   - Drag a filter off the slots to remove it.

## Customizing

- **Add or Modify Filters** in `js/filters.js`. Each filter defines:  
  - A unique **name** and **emoji**  
  - A pixel-manipulating **apply** function  
  - (Optionally) a **renderParamUI** method for adjustable settings
- **Update the Layout** or styling in `css/style.css`.

## Contributing

Contributions, suggestions, and bug reports are welcome! Simply open an issue or submit a pull request if you have ideas to improve Filter Alchemy.
