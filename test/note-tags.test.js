import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { addNote, listNotes, listNotesByTag, resetNotes } from '../src/notes.js';

beforeEach(() => resetNotes());

test('addNote defaults tags to []', () => {
  const note = addNote('a');
  assert.deepEqual(note.tags, []);
  assert.deepEqual(listNotes()[0].tags, []);
  const withEmpty = addNote('a', []);
  assert.deepEqual(withEmpty.tags, []);
  assert.deepEqual(listNotes()[1].tags, []);
});

test('addNote trims and lowercases tags', () => {
  const note = addNote('a', ['  Work ', 'HOME']);
  assert.deepEqual(note.tags, ['work', 'home']);
});

test('addNote de-duplicates tags in first-occurrence order', () => {
  const note = addNote('a', ['A', 'a ', ' b', 'B']);
  assert.deepEqual(note.tags, ['a', 'b']);
});

test('addNote does not keep the caller tags array', () => {
  const input = ['x'];
  const note = addNote('a', input);
  input.push('y');
  assert.deepEqual(note.tags, ['x']);
  assert.deepEqual(listNotes()[0].tags, ['x']);
});

test('addNote rejects blank tags without storing', () => {
  assert.throws(() => addNote('a', ['ok', '  ']), /tag is required/);
  assert.throws(() => addNote('a', ['']), /tag is required/);
  assert.deepEqual(listNotes(), []);
});

test('addNote rejects non-string tags without storing', () => {
  assert.throws(() => addNote('a', [1]), /tag is required/);
  assert.throws(() => addNote('a', [null]), /tag is required/);
  assert.throws(() => addNote('a', [undefined]), /tag is required/);
  assert.throws(() => addNote('a', [{}]), /tag is required/);
  // eslint-disable-next-line no-sparse-arrays
  assert.throws(() => addNote('a', [, 'x']), /tag is required/);
  assert.deepEqual(listNotes(), []);
});

test('addNote rejects non-array tags and consumes no id', () => {
  assert.throws(() => addNote('a', null), /tags must be an array/);
  assert.throws(() => addNote('a', 'work'), /tags must be an array/);
  assert.throws(() => addNote('a', {}), /tags must be an array/);
  assert.deepEqual(listNotes(), []);
  assert.equal(addNote('a').id, 1);
});

test('text is validated before tags', () => {
  assert.throws(() => addNote('', ['x']), /text is required/);
  assert.throws(() => addNote('', null), /text is required/);
  assert.deepEqual(listNotes(), []);
  assert.equal(addNote('a').id, 1);
});

function seed() {
  addNote('one', ['work']);
  addNote('two', ['home']);
  addNote('three', ['work', 'home']);
}

test('listNotesByTag returns matching notes in insertion order', () => {
  seed();
  assert.deepEqual(listNotesByTag('work').map((n) => n.id), [1, 3]);
});

test('listNotesByTag matches case- and whitespace-insensitively', () => {
  seed();
  assert.deepEqual(listNotesByTag(' WORK ').map((n) => n.id), [1, 3]);
});

test('listNotesByTag returns [] when nothing matches', () => {
  assert.deepEqual(listNotesByTag('none'), []);
  seed();
  assert.deepEqual(listNotesByTag('none'), []);
});

test('listNotesByTag returns copies', () => {
  seed();
  const [first] = listNotesByTag('work');
  first.text = 'changed';
  assert.equal(listNotes()[0].text, 'one');
});

test('listNotesByTag rejects missing, non-string or blank tag', () => {
  assert.throws(() => listNotesByTag(), /tag is required/);
  assert.throws(() => listNotesByTag(5), /tag is required/);
  assert.throws(() => listNotesByTag(null), /tag is required/);
  assert.throws(() => listNotesByTag('  '), /tag is required/);
});

test('list results do not share tags arrays with the store', () => {
  addNote('a', ['x']);
  listNotes()[0].tags.push('y');
  listNotesByTag('x')[0].tags.push('z');
  assert.deepEqual(listNotes()[0].tags, ['x']);
});
