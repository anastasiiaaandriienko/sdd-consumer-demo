import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { addNote, listNotes, resetNotes } from '../src/notes.js';

beforeEach(() => resetNotes());

test('addNote stores a trimmed note', () => {
  const note = addNote('  buy milk ');
  assert.equal(note.text, 'buy milk');
  assert.equal(listNotes().length, 1);
});

test('addNote rejects empty text', () => {
  assert.throws(() => addNote('  '), /text is required/);
});
