'use strict';

// ---------- Constants & DOM ----------
const STORAGE_KEY = 'myNotes'; // same key as before, so your old notes still show up
const THEME_KEY = 'theme';
const COLORS = ['default', 'yellow', 'green', 'blue', 'pink', 'purple'];

const ICON_EDIT =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19h1.43l9.77-9.77-1.42-1.43L5 17.58V19Zm-2 2v-4.25L16.2 3.57q.3-.28.66-.43T17.63 3q.4 0 .78.15t.64.45l1.38 1.4q.3.27.44.65T21 6.4q0 .4-.14.76t-.43.66L7.25 21H3Z"/></svg>';
const ICON_DELETE =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21q-.82 0-1.41-.59T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .82-.59 1.41T17 21H7Zm2-4h2V8H9v9Zm4 0h2V8h-2v9Z"/></svg>';

const $ = (selector) => document.querySelector(selector);

const els = {
    grid: $('#notesGrid'),
    empty: $('#emptyState'),
    emptyTitle: $('#emptyTitle'),
    emptyText: $('#emptyText'),
    count: $('#noteCount'),
    search: $('#searchInput'),
    themeBtn: $('#themeBtn'),
    addBtn: $('#addNoteBtn'),
    deleteAllBtn: $('#deleteAllBtn'),
    dialog: $('#noteDialog'),
    form: $('#noteForm'),
    dialogTitle: $('#dialogTitle'),
    titleInput: $('#titleInput'),
    contentInput: $('#contentInput'),
    closeDialogBtn: $('#closeDialogBtn'),
    cancelBtn: $('#cancelBtn'),
    toast: $('#toast'),
    toastText: $('#toastText'),
    undoBtn: $('#undoBtn'),
};

// ---------- State ----------
let notes = loadNotes();
let query = '';
let editingId = null;
let snapshot = null; // copy of notes before a delete, used by Undo
let toastTimer = null;

// ---------- Storage ----------
function makeId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadNotes() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((n) => n && typeof n.title === 'string' && typeof n.content === 'string')
            .map((n) => ({
                id: n.id || makeId(),
                title: n.title,
                content: n.content,
                color: COLORS.includes(n.color) ? n.color : 'default',
                updatedAt: n.updatedAt || null,
            }));
    } catch {
        return [];
    }
}

function saveNotes() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
        showToast('Could not save notes (storage is full or blocked).');
    }
}

// ---------- Theme ----------
function applyTheme(theme, persist) {
    document.documentElement.dataset.theme = theme;
    els.themeBtn.textContent = theme === 'dark' ? '🌞' : '🌙';
    els.themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    if (persist) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch { /* ignore */ }
    }
}

els.themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
});

// ---------- Rendering ----------
function createCard(note) {
    const card = document.createElement('article');
    card.className = 'note';
    card.dataset.id = note.id;
    card.dataset.color = note.color;

    // Only fixed markup goes through innerHTML. User text is added with textContent (no XSS).
    card.innerHTML =
        '<div class="note-tools">' +
        `<button class="icon-btn" type="button" data-action="edit" aria-label="Edit note">${ICON_EDIT}</button>` +
        `<button class="icon-btn danger" type="button" data-action="delete" aria-label="Delete note">${ICON_DELETE}</button>` +
        '</div>' +
        '<h2 class="note-title"></h2>' +
        '<p class="note-content"></p>' +
        '<time class="note-date"></time>';

    card.querySelector('.note-title').textContent = note.title;
    card.querySelector('.note-content').textContent = note.content;

    const time = card.querySelector('.note-date');
    if (note.updatedAt) {
        const date = new Date(note.updatedAt);
        time.dateTime = date.toISOString();
        time.textContent = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } else {
        time.remove();
    }
    return card;
}

function render() {
    const q = query.trim().toLowerCase();
    const visible = q
        ? notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
        : notes;

    // newest first
    els.grid.replaceChildren(...[...visible].reverse().map(createCard));

    const total = notes.length;
    els.count.textContent = `${total} ${total === 1 ? 'note' : 'notes'}`;
    els.deleteAllBtn.disabled = total === 0;

    els.empty.hidden = visible.length > 0;
    if (total === 0) {
        els.emptyTitle.textContent = 'No notes yet';
        els.emptyText.textContent = 'Click “Add Note” to write your first note.';
    } else if (visible.length === 0) {
        els.emptyTitle.textContent = 'No matching notes';
        els.emptyText.textContent = 'Try a different search word.';
    }
}

// ---------- Dialog (add / edit) ----------
// A whitespace-only value should not count as filled in.
function validateFields() {
    els.titleInput.setCustomValidity(els.titleInput.value.trim() ? '' : 'Please enter a title');
    els.contentInput.setCustomValidity(els.contentInput.value.trim() ? '' : 'Please write some content');
}

function openDialog(note = null) {
    editingId = note ? note.id : null;
    els.dialogTitle.textContent = note ? 'Edit Note' : 'Add New Note';
    els.titleInput.value = note ? note.title : '';
    els.contentInput.value = note ? note.content : '';
    els.form.elements.color.value = note ? note.color : 'default';
    validateFields();
    els.dialog.showModal();
}

function closeDialog() {
    els.dialog.close();
}

els.addBtn.addEventListener('click', () => openDialog());
els.closeDialogBtn.addEventListener('click', closeDialog);
els.cancelBtn.addEventListener('click', closeDialog);

// click on the dark backdrop closes the dialog
els.dialog.addEventListener('click', (e) => {
    if (e.target === els.dialog) closeDialog();
});

els.dialog.addEventListener('close', () => {
    els.form.reset();
    editingId = null;
});

els.titleInput.addEventListener('input', validateFields);
els.contentInput.addEventListener('input', validateFields);

// Ctrl/Cmd + Enter saves
els.contentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        els.form.requestSubmit();
    }
});

els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = els.titleInput.value.trim();
    const content = els.contentInput.value.trim();
    const color = els.form.elements.color.value || 'default';
    if (!title || !content) return;

    if (editingId) {
        notes = notes.map((n) =>
            n.id === editingId ? { ...n, title, content, color, updatedAt: Date.now() } : n
        );
    } else {
        notes.push({ id: makeId(), title, content, color, updatedAt: Date.now() });
    }

    saveNotes();
    render();
    closeDialog();
});

// ---------- Card actions (one listener for all cards) ----------
els.grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.closest('.note').dataset.id;
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    if (btn.dataset.action === 'edit') openDialog(note);
    if (btn.dataset.action === 'delete') deleteNote(id);
});

// ---------- Delete + Undo ----------
function deleteNote(id) {
    snapshot = [...notes];
    notes = notes.filter((n) => n.id !== id);
    saveNotes();
    render();
    showToast('Note deleted', true);
}

function deleteAll() {
    if (notes.length === 0) return;
    if (!confirm(`Delete all ${notes.length} notes? You can undo right after.`)) return;
    snapshot = [...notes];
    notes = [];
    saveNotes();
    render();
    showToast('All notes deleted', true);
}

els.deleteAllBtn.addEventListener('click', deleteAll);

els.undoBtn.addEventListener('click', () => {
    if (!snapshot) return;
    notes = snapshot;
    snapshot = null;
    saveNotes();
    render();
    hideToast();
});

function showToast(message, withUndo = false) {
    els.toastText.textContent = message;
    els.undoBtn.hidden = !withUndo;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 5000);
}

function hideToast() {
    els.toast.hidden = true;
}

// ---------- Search ----------
els.search.addEventListener('input', () => {
    query = els.search.value;
    render();
});

// Keep several open tabs in sync
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
        notes = loadNotes();
        render();
    }
});

// ---------- Start ----------
applyTheme(document.documentElement.dataset.theme || 'light', false);
render();
