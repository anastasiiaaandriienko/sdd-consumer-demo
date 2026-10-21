// In-memory notes store.
const notes = [];
let nextId = 1;

function normalizeTag(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('tag is required');
  }
  return value.trim().toLowerCase();
}

function normalizeTags(tags) {
  if (tags === undefined) return [];
  if (!Array.isArray(tags)) {
    throw new Error('tags must be an array');
  }
  const result = [];
  // Index loop so sparse arrays (holes) are visited and rejected.
  for (let i = 0; i < tags.length; i++) {
    const tag = normalizeTag(tags[i]);
    if (!result.includes(tag)) result.push(tag);
  }
  return result;
}

export function addNote(text, tags) {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new Error('text is required');
  }
  const normalizedTags = normalizeTags(tags);
  const note = {
    id: nextId++,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    tags: normalizedTags,
  };
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
