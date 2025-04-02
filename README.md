# Filter Alchemy

Filter Alchemy is a browser-based video filtering playground that lets you drag and drop “filter emojis” onto puzzle slots, creating fun real-time effects on your webcam feed. Designed for quick experimentation, it features:

- A **live video feed** (using `getUserMedia`)  
- Multiple **filters** (e.g., invert, grayscale, pixelate, swirl)  
- **Drag-and-drop** controls for reordering or removing filters  
- Parameter sliders for **customizing** each filter's intensity

## Features

- **Sleek Interface**: Minimalist design with a dark background and a clean puzzle layout.  
- **Mirrored Video**: Emulates a “selfie” view, as if on popular video conferencing apps.  
- **Modular Filters**: Easily extendable by editing `filters.js`.  
- **Local Execution**: No backend needed—simply open `index.html` over HTTPS.

## Getting Started

1. **Clone or Download** this repository.  
2. **Open `index.html`** in a modern browser with a valid HTTPS environment (or `localhost`) so the camera can be accessed.  
3. **Grant Camera Permission** when prompted.  
4. **Drag filters** from the “bank” into the four puzzle slots.  
   - **Click** a slot to open its parameter editor (if the filter supports custom parameters).  
   - **Drag** a filter off the slots to remove it.

## Customizing

- **Add or Modify Filters** in `js/filters.js`. Each filter defines:  
  - A unique **name** and **emoji**  
  - A pixel-manipulating **apply** function  
  - (Optionally) a **renderParamUI** method for adjustable settings
- **Update the Layout** or styling in `css/style.css`.

## Contributing

Contributions, suggestions, and bug reports are welcome! Simply open an issue or submit a pull request if you have ideas to improve Filter Alchemy.

## License

This project is provided under the [MIT License](LICENSE). You’re free to use, modify, and distribute the code. If you build upon it, we’d love to hear about your creation!
