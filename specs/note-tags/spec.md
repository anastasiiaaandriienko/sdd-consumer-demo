# Spec: Optional tags on notes
- **Key:** TAGS · **Status:** Approved (2026-10-21) · **Date:** 2026-10-21 · **Areas:** whole repository (single area: `src/`, `test/`)
- **Source request:** Add optional tags to notes: `addNote(text, tags)` takes an optional array of tag strings (trimmed, lowercased, de-duplicated, empty tags rejected); every stored note has a `tags` array (empty by default); a new `listNotesByTag(tag)` returns copies of the notes that have that tag, matched case-insensitively. Requested by the user via the main agent. Clarifications Q1–Q6 were answered by the user (2026-10-21) and are recorded in §14.

## 1. Goals
- Callers can attach zero or more normalized tags to a note when they create it.
- Every stored note exposes a `tags` array, which is `[]` when no tags were given.
- Callers can list the notes that carry a given tag, ignoring case.

## 2. Non-goals
- Editing, adding or removing tags on an existing note (no update API exists today).
- Matching several tags at once (AND/OR), prefix/fuzzy matching, or listing all known tags.
- Persistence beyond the existing in-memory store.
- Limits on the number of tags per note or on tag length (decision D6).
- Changing how `text` is validated, or the `id`/`createdAt` behaviour.

## 3. Actors and triggers
- **Actor:** JavaScript code inside the same process that imports `src/notes.js` (today only the tests in `test/notes.test.js:3`). No UI, HTTP API, CLI or schedule.
- **Triggers:** synchronous calls to `addNote(text, tags)`, `listNotesByTag(tag)`, plus the existing `listNotes()` and `resetNotes()`.

## 4. Current state (verified, path:line)
- The store is a module-level array `notes` with an id counter `nextId` that starts at 1 (`src/notes.js:2-3`).
- `addNote(text)` accepts one parameter (`src/notes.js:5`). It throws `Error('text is required')` when `text` is not a string or is blank after trimming (`src/notes.js:6-8`).
- A stored note is `{ id, text: text.trim(), createdAt: ISO string }` (`src/notes.js:9`). `addNote` pushes the object and returns that same object, not a copy (`src/notes.js:10-11`).
- `listNotes()` returns shallow copies (`{ ...note }`) in insertion order (`src/notes.js:15`). If `tags` were an array, a shallow copy would share it with the stored note.
- `resetNotes()` empties the store and resets the id counter to 1 (`src/notes.js:18-21`).
- Tests use `node:test` with `resetNotes()` in `beforeEach` (`test/notes.test.js:1-5`). They cover trimming and empty-text rejection (`test/notes.test.js:7-15`).
- No tags concept exists anywhere today.

## 5. Inputs and provenance
| Input | Source | Trust | Validation / limits |
|---|---|---|---|
| `text` | caller | untrusted | unchanged: must be a non-blank string, else `text is required` (`src/notes.js:6`). Checked before `tags` |
| `tags` (2nd argument of `addNote`) | caller | untrusted | optional. `undefined` gives `[]`. Any other non-array value, including `null`, throws `tags must be an array` (D3) |
| each element of `tags` | caller | untrusted | must be a string that is non-blank after trimming, else throws `tag is required` (D1, D2). Then trimmed, lowercased (`toLowerCase()`) and de-duplicated in first-occurrence order |
| `tag` (argument of `listNotesByTag`) | caller | untrusted | must be a string that is non-blank after trimming, else throws `tag is required` (D4). Trimmed and lowercased before matching |
| Count and length limits | — | — | none (D6) |

## 6. Outputs (contracts, UI, persistence, logs)
- `addNote(text, tags?)` returns the stored note `{ id, text, createdAt, tags }`. `tags` is an array of normalized strings in first-occurrence order (D7). As today, the return value is the stored object itself (D13).
- `listNotes()` returns copies of the notes in insertion order. Each copy now includes `tags`, and its `tags` is a new array, not the stored one (D5).
- `listNotesByTag(tag)` is a new named export. It returns an array of copies of the matching notes in insertion order, or `[]` when nothing matches (D8). Each copy has its own new `tags` array (D5).
- Errors: `Error` instances with the messages `tags must be an array` and `tag is required` (D12).
- Persistence: in memory only. Logs: none.

## 7. Functional requirements (FR-1…, each → AC-IDs)
- **FR-1** `addNote` accepts an optional second argument `tags`. Without it, the stored note has `tags: []`. → AC-TAGS-01, AC-TAGS-02
- **FR-2** Each tag is trimmed and lowercased, and duplicates (after normalization) are removed. → AC-TAGS-03, AC-TAGS-04, AC-TAGS-05
- **FR-3** `addNote` throws on blank tags, non-string tag elements and non-array `tags`, and a rejected call stores nothing. → AC-TAGS-06, AC-TAGS-07, AC-TAGS-08, AC-TAGS-09
- **FR-4** `listNotesByTag(tag)` returns copies of exactly the notes whose `tags` contain the normalized `tag`. → AC-TAGS-10, AC-TAGS-11, AC-TAGS-12, AC-TAGS-13
- **FR-5** `listNotesByTag` throws on a missing, non-string or blank argument. → AC-TAGS-14
- **FR-6** Existing behaviour stays the same for the `text`, `id`, `createdAt`, `listNotes` order and `resetNotes`. → AC-TAGS-15
- **FR-7** Notes returned by `listNotes` and `listNotesByTag` do not share their `tags` array with the store. → AC-TAGS-16

## 8. Constraints
- No new dependencies (CLAUDE.md). Do not edit `package.json` dependency sections.
- ES module named exports. Existing exports keep their names and signatures. The `tags` parameter is additive.
- Unit tests use `node:test` under `test/`. Check command: `npm test`.

## 9. Security (untrusted input, authorization/tenancy, paths, secrets)
- `tags` and `tag` are untrusted. Check their types before calling any string method, so malformed input fails with the documented `Error` messages rather than an incidental `TypeError`.
- The store must not keep a reference to the caller's `tags` array (AC-TAGS-05), and list results must not expose the stored `tags` arrays (AC-TAGS-16).
- No authorization, tenancy, file paths or secrets are involved.

## 10. Performance (numbers or [NEEDS CLARIFICATION])
- No numeric targets and no limits (D6). `listNotesByTag` may scan every note (O(notes × tags)), which is acceptable for an in-memory demo store.

## 11. Error handling and failure modes
| Failure | Behaviour | AC |
|---|---|---|
| `text` invalid (with or without tags) | throws `text is required`, nothing stored (unchanged). Text is checked first, so it wins when `tags` is also invalid | AC-TAGS-15 |
| a tag is blank after trimming | throws `tag is required`, nothing stored | AC-TAGS-06 |
| a tag element is not a string | throws `tag is required`, nothing stored | AC-TAGS-07 |
| `tags` is not an array and not `undefined` (incl. `null`) | throws `tags must be an array`, nothing stored | AC-TAGS-08 |
| rejected `addNote` call | store unchanged and no id consumed | AC-TAGS-09 |
| `listNotesByTag` with a missing, non-string or blank argument | throws `tag is required` | AC-TAGS-14 |
| no note has the tag | returns `[]` | AC-TAGS-12 |

## 12. Acceptance criteria (EARS)
| AC-ID | EARS statement | Verification |
|---|---|---|
| AC-TAGS-01 | When `addNote(text)` is called without `tags`, the notes module shall store and return a note whose `tags` is an empty array. | unit |
| AC-TAGS-02 | When `addNote(text, [])` is called, the notes module shall store a note whose `tags` is an empty array. | unit |
| AC-TAGS-03 | When `addNote` is called with tags that have surrounding whitespace or upper-case letters, the notes module shall store each tag trimmed and lowercased (e.g. `['  Work ']` → `['work']`). | unit |
| AC-TAGS-04 | When `addNote` is called with tags that are equal after normalization, the notes module shall store each tag only once, in first-occurrence order (e.g. `['A','a ',' b']` → `['a','b']`). | unit |
| AC-TAGS-05 | When the caller changes its `tags` array after `addNote` returns, the notes module shall leave the stored note's `tags` unchanged. | unit |
| AC-TAGS-06 | If any element of `tags` is a string that is blank after trimming (e.g. `''`, `'  '`), then the notes module shall throw an `Error` whose message is `tag is required`. | unit |
| AC-TAGS-07 | If any element of `tags` is not a string (e.g. `1`, `null`, `undefined`, `{}`), then the notes module shall throw an `Error` whose message is `tag is required`. | unit |
| AC-TAGS-08 | If `tags` is provided and is not an array (e.g. `null`, `'work'`, `{}`), then the notes module shall throw an `Error` whose message is `tags must be an array`. | unit |
| AC-TAGS-09 | If `addNote` throws for any reason, then the notes module shall leave `listNotes()` unchanged, and the next successful note shall get the id that would have been next. | unit |
| AC-TAGS-10 | When `listNotesByTag(tag)` is called, the notes module shall return, in insertion order, every note whose `tags` contains `tag` after normalization, and no other notes. | unit |
| AC-TAGS-11 | When `listNotesByTag` is called with a tag that differs only in case or surrounding whitespace (e.g. `' WORK '`), the notes module shall match notes tagged `work`. | unit |
| AC-TAGS-12 | When no note has the given tag, the notes module shall return an empty array from `listNotesByTag`. | unit |
| AC-TAGS-13 | When the caller changes a top-level field of a note returned by `listNotesByTag`, the notes module shall leave the stored note unchanged. | unit |
| AC-TAGS-14 | If `listNotesByTag` is called with no argument, a non-string argument or a string that is blank after trimming, then the notes module shall throw an `Error` whose message is `tag is required`. | unit |
| AC-TAGS-15 | The notes module shall keep its existing behaviour for `text` trimming and validation, ids, `createdAt`, `listNotes` order and `resetNotes`. The existing tests in `test/notes.test.js` shall pass unchanged. | unit |
| AC-TAGS-16 | When the caller changes the `tags` array of a note returned by `listNotes` or `listNotesByTag`, the notes module shall leave the stored note's `tags` unchanged, as seen in a later `listNotes()` call. | unit |

## 13. Test scenarios (each → AC-IDs)
- T1: `addNote('a')` has `tags: []`, and so does `addNote('a', [])`. → AC-TAGS-01, AC-TAGS-02
- T2: `addNote('a', ['  Work ', 'HOME'])` stores `['work','home']`. → AC-TAGS-03
- T3: `addNote('a', ['A','a ',' b','B'])` stores `['a','b']`. → AC-TAGS-04
- T4: push to the caller's input array after `addNote`; the stored tags are unchanged. → AC-TAGS-05
- T5: `addNote('a', ['ok', '  '])` and `addNote('a', [''])` throw `/tag is required/`; `listNotes()` stays empty. → AC-TAGS-06, AC-TAGS-09
- T6: `[1]`, `[null]`, `[undefined]` and `[{}]` as tags throw `/tag is required/`; `listNotes()` stays empty. → AC-TAGS-07, AC-TAGS-09
- T7: `null`, `'work'` and `{}` as `tags` throw `/tags must be an array/`. After the rejections, `addNote('a')` gets id 1. → AC-TAGS-08, AC-TAGS-09
- T8: three notes tagged `work`, `home` and `work,home`; `listNotesByTag('work')` returns notes 1 and 3 in order. → AC-TAGS-10
- T9: `listNotesByTag(' WORK ')` matches the notes tagged `work`. → AC-TAGS-11
- T10: `listNotesByTag('none')` returns `[]`, including on an empty store. → AC-TAGS-12
- T11: change the `text` of a result; `listNotes()` still shows the original. → AC-TAGS-13
- T12: `listNotesByTag()`, `listNotesByTag(5)`, `listNotesByTag(null)` and `listNotesByTag('  ')` throw `/tag is required/`. → AC-TAGS-14
- T13: the existing tests pass; `addNote('', ['x'])` and `addNote('', null)` still throw `text is required`. → AC-TAGS-15
- T14: push into the `tags` of a result from `listNotes` and from `listNotesByTag`; a later `listNotes()` shows the original tags. → AC-TAGS-16

## 14. Assumptions (to be confirmed)
- none. All assumptions were confirmed by the user on 2026-10-21. The decisions:
  - **D1 (Q1)** A tag that is blank after trimming makes `addNote` throw. Nothing is stored.
  - **D2 (Q2)** A tag element that is not a string makes `addNote` throw.
  - **D3 (Q3)** A `tags` value other than `undefined` that is not an array, including `null`, makes `addNote` throw.
  - **D4 (Q4)** `listNotesByTag` throws on a missing, non-string or blank argument.
  - **D5 (Q5)** `listNotes` and `listNotesByTag` also copy each note's `tags` array.
  - **D6 (Q6)** There are no limits on tag count or tag length.
  - **D7 (A1)** Stored tags keep first-occurrence order after normalization. They are not sorted.
  - **D8 (A2)** `listNotesByTag` returns matches in insertion order, like `listNotes()`.
  - **D9 (A3)** All validation (text first, then tags) runs before anything is stored or the id counter advances. A rejected call has no side effects.
  - **D10 (A4)** Lowercasing uses `String.prototype.toLowerCase()`. The `listNotesByTag` argument is trimmed and lowercased the same way.
  - **D11 (A5)** Whitespace inside a tag is kept. Only leading and trailing whitespace is trimmed.
  - **D12 (A6)** The error messages follow the `text is required` style. `tags must be an array` is for a non-array `tags`. `tag is required` is for any non-string or blank tag, in both `addNote` and `listNotesByTag`, the same way `text is required` covers both non-string and blank text.
  - **D13 (A7)** `addNote` keeps returning the stored object itself (`src/notes.js:11`). D5 applies to the list functions only.

## 15. Open questions ([NEEDS CLARIFICATION] index)
- none. Q1–Q6 are resolved as D1–D6.

## 16. Approvals required (protected paths, dependencies, paid calls, integration/e2e)
- None expected. The change stays in `src/notes.js` and `test/`. No dependencies, protected paths, paid calls, or integration/e2e suites.
