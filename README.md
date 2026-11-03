# Quick Notes

A simple, fast notes app built with plain HTML, CSS and JavaScript. No frameworks, no build step. Just open `index.html`.

**Live demo:** _add your GitHub Pages link here after you publish it_

## Features

- Add, edit and delete notes
- Pick a color for every note (6 colors)
- Search notes by title or content
- Undo after deleting a note or deleting all notes
- Light and dark theme (follows your device on the first visit, then remembers your choice)
- Notes are saved in your browser with `localStorage`, so they stay after a refresh
- Responsive layout that works on phones, tablets and desktops
- Keyboard friendly: `Esc` closes the dialog, `Ctrl + Enter` saves a note

## Tech used

- **HTML5**: `<dialog>` element for the add/edit form
- **CSS3**: custom properties (variables) for theming, CSS Grid, `color-mix()`, media queries
- **JavaScript (ES6+)**: DOM manipulation, event delegation, `localStorage`

## How to run

1. Download or clone this repository.
2. Open `index.html` in any modern browser.

```bash
git clone https://github.com/YOUR-USERNAME/quick-notes.git
cd quick-notes
```

## Project structure

```
quick-notes/
├── index.html   # page structure
├── style.css    # design, themes and responsive layout
└── script.js    # app logic (notes, search, theme, undo)
```

## What I learned

- Building full CRUD (create, read, update, delete) with vanilla JavaScript
- Protecting against XSS by using `textContent` instead of putting user text in `innerHTML`
- Making a layout responsive with CSS Grid (`auto-fill` and `minmax`)
- Working with `localStorage` and the native `<dialog>` element

## Ideas for the future

- [ ] Pin important notes to the top
- [ ] Categories or tags
- [ ] Export and import notes as a JSON file

## Author

Made by **YOUR NAME**. Feel free to open an issue or say hi!
