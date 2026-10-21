// In-memory notes store.
const notes = [];
let nextId = 1;

export function addNote(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new Error('text is required');
  }
  const note = { id: nextId++, text: text.trim(), createdAt: new Date().toISOString() };
  notes.push(note);
  return note;
}

export function listNotes() {
  return notes.map((note) => ({ ...note }));
}

export function resetNotes() {
  notes.length = 0;
  nextId = 1;
}
