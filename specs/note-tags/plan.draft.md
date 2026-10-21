STATUS: READY
Spec: specs/note-tags/spec.md (Key TAGS, 16 ACs) · Goal: add optional normalized `tags` to `addNote`, copy `tags` in list results, and add `listNotesByTag(tag)`.
Profile facts used:
- Artifact folder `specs/<slug>/` (CLAUDE.md:8, prompt).
- One area, `src/` + `test/`, using `node:test` with no dependencies (CLAUDE.md:6).
- Check command `npm test`, which runs `node --test "test/**/*.test.js"` (CLAUDE.md:7, package.json:8).
- Protected paths: `package.json` dependency sections, `.claude/**`, `CLAUDE.md` (CLAUDE.md:9), plus the profile defaults (lockfiles, CI, env files).
- No INSIGHTS.md files (prompt).
- Node >=22 (package.json:11). ES modules (package.json:5).
Assumptions (technical only; each must be confirmed by the user):
- A1: New tests go in a new file `test/note-tags.test.js`. This leaves `test/notes.test.js` byte-for-byte unchanged, which is the literal reading of AC-TAGS-15 ("existing tests … pass unchanged"). The existing glob already picks the file up (package.json:8). If you would rather have one test file, the only change to the existing file would be adding `listNotesByTag` to the import on test/notes.test.js:3. Nothing existing would be edited beyond that.
- A2: `node --test` runs each test file in its own process by default on Node 22, so the module-level store (src/notes.js:2-3) is not shared between files. Each new file still calls `resetNotes()` in `beforeEach`, like test/notes.test.js:5.
Architecture:
- Single module `src/notes.js`. Data flow: caller → validate `text` (src/notes.js:6-8, unchanged, checked first) → validate and normalize `tags` → build note → push. All validation runs before `nextId++` (src/notes.js:9), so a rejected call changes nothing (D9).
- Add private helper `normalizeTag(value)`. It throws `Error('tag is required')` for a non-string or blank value and otherwise returns `value.trim().toLowerCase()`. `addNote` (per element) and `listNotesByTag` (argument) both use it, giving one rule for D10/D12.
- Add private helper `normalizeTags(tags)`. `undefined` → `[]`. A non-array → `Error('tags must be an array')`. Otherwise it maps through `normalizeTag` and de-duplicates in first-occurrence order (D7). This always builds a new array, which covers AC-TAGS-05.
- Add private helper `copyNote(note)` → `{ ...note, tags: [...note.tags] }`. It replaces the shallow copy in `listNotes` (src/notes.js:15) and is reused by `listNotesByTag` (D5).
- `addNote` keeps returning the stored object (src/notes.js:11, D13). New named export `listNotesByTag(tag)`.
- Reused: existing `text` validation, `resetNotes` (src/notes.js:18-21), and the test setup pattern (test/notes.test.js:1-5).
- No contract or persistence layers exist. No dependencies are added.
Approvals required: none. No protected path is touched.

## Tasks
### T1 — Tags on addNote (normalize, validate, no side effects)
- AC: AC-TAGS-01, AC-TAGS-02, AC-TAGS-03, AC-TAGS-04, AC-TAGS-05, AC-TAGS-06, AC-TAGS-07, AC-TAGS-08, AC-TAGS-09, AC-TAGS-15
- Area: whole repo · Agent: sdd-engineering:implementer · Skills: none from the skill map apply (plain JS module, see Limitations)
- Files: M `src/notes.js` · A `test/note-tags.test.js` (new)
- Depends on: —
- Steps:
  - Add the private helpers `normalizeTag` and `normalizeTags` (see Architecture).
  - Change the signature to `addNote(text, tags)`. Keep the text check first, then run `normalizeTags(tags)` before `nextId++`, and store `tags` on the note.
  - Make `listNotes` use `copyNote` so the stored `tags` array is never exposed (needed now that notes carry `tags`; T2 adds the dedicated tests).
  - Create `test/note-tags.test.js` with imports, `beforeEach(() => resetNotes())`, and scenarios T1–T7 and T13 from spec §13.
- Acceptance criteria:
  - AC-TAGS-01: `addNote('a').tags` deep-equals `[]`, and so does the stored note.
  - AC-TAGS-02: `addNote('a', [])` stores `tags: []`.
  - AC-TAGS-03: `['  Work ', 'HOME']` → `['work','home']`.
  - AC-TAGS-04: `['A','a ',' b','B']` → `['a','b']`.
  - AC-TAGS-05: changing the caller's input array afterwards leaves the stored tags unchanged.
  - AC-TAGS-06: `['ok','  ']` and `['']` throw `/tag is required/`.
  - AC-TAGS-07: `[1]`, `[null]`, `[undefined]` and `[{}]` throw `/tag is required/`.
  - AC-TAGS-08: `null`, `'work'` and `{}` throw `/tags must be an array/`.
  - AC-TAGS-09: after these rejections `listNotes()` is `[]` and the next `addNote('a')` gets id 1.
  - AC-TAGS-15: `addNote('', ['x'])` and `addNote('', null)` throw `/text is required/`. `test/notes.test.js` is not modified and passes.
- Tests: `test/note-tags.test.js` (new):
  - `addNote defaults tags to []` (spec T1)
  - `addNote trims and lowercases tags` (T2)
  - `addNote de-duplicates tags in first-occurrence order` (T3)
  - `addNote does not keep the caller tags array` (T4)
  - `addNote rejects blank tags without storing` (T5)
  - `addNote rejects non-string tags without storing` (T6)
  - `addNote rejects non-array tags and consumes no id` (T7)
  - `text is validated before tags` (T13)
- Checks: `npm test`
- Risks: calling `.trim()` before the type check would throw a `TypeError` (spec §9). The type checks must come first. `[undefined]` must be rejected as an element and must not be mistaken for an omitted `tags`.
- Commit: C1 — `feat(notes): add optional normalized tags to addNote`

### T2 — listNotesByTag and copied tags arrays
- AC: AC-TAGS-10, AC-TAGS-11, AC-TAGS-12, AC-TAGS-13, AC-TAGS-14, AC-TAGS-16, AC-TAGS-15
- Area: whole repo · Agent: sdd-engineering:implementer · Skills: none from the skill map apply
- Files: M `src/notes.js` · M `test/note-tags.test.js` (created in T1)
- Depends on: T1 (same files; it needs `normalizeTag` and `copyNote`)
- Steps:
  - Add `export function listNotesByTag(tag)`. It runs `const t = normalizeTag(tag)` and returns `notes.filter((n) => n.tags.includes(t)).map(copyNote)`.
  - Add scenarios T8–T12 and T14 from spec §13 to `test/note-tags.test.js`, and add `listNotesByTag` to its import.
- Acceptance criteria:
  - AC-TAGS-10: with notes tagged `work`, `home` and `work,home`, `listNotesByTag('work')` returns ids `[1,3]` in that order.
  - AC-TAGS-11: `' WORK '` matches the notes tagged `work`.
  - AC-TAGS-12: `'none'` returns `[]`, both on an empty store and on a populated one.
  - AC-TAGS-13: changing `text` on a result leaves `listNotes()` unchanged.
  - AC-TAGS-14: no argument, `5`, `null` and `'  '` all throw `/tag is required/`.
  - AC-TAGS-16: pushing into `tags` of a result from `listNotes` or `listNotesByTag` leaves a later `listNotes()` unchanged.
  - AC-TAGS-15: `test/notes.test.js` still passes unchanged.
- Tests: `test/note-tags.test.js`:
  - `listNotesByTag returns matching notes in insertion order` (T8)
  - `listNotesByTag matches case- and whitespace-insensitively` (T9)
  - `listNotesByTag returns [] when nothing matches` (T10)
  - `listNotesByTag returns copies` (T11)
  - `listNotesByTag rejects missing, non-string or blank tag` (T12)
  - `list results do not share tags arrays with the store` (T14)
- Checks: `npm test`
- Risks: if a stored note had no `tags` array, `n.tags.includes` would fail. This cannot happen, because T1 makes every stored note carry `tags`.
- Commit: C2 — `feat(notes): add listNotesByTag and copy tags in list results`

## AC coverage
| AC-ID | Tasks | Test(s) | Verification |
|---|---|---|---|
| AC-TAGS-01 | T1 | addNote defaults tags to [] | unit |
| AC-TAGS-02 | T1 | addNote defaults tags to [] | unit |
| AC-TAGS-03 | T1 | addNote trims and lowercases tags | unit |
| AC-TAGS-04 | T1 | addNote de-duplicates tags… | unit |
| AC-TAGS-05 | T1 | addNote does not keep the caller tags array | unit |
| AC-TAGS-06 | T1 | addNote rejects blank tags without storing | unit |
| AC-TAGS-07 | T1 | addNote rejects non-string tags without storing | unit |
| AC-TAGS-08 | T1 | addNote rejects non-array tags and consumes no id | unit |
| AC-TAGS-09 | T1 | rejects blank / non-string / non-array (store and id asserts) | unit |
| AC-TAGS-10 | T2 | listNotesByTag returns matching notes in insertion order | unit |
| AC-TAGS-11 | T2 | listNotesByTag matches case- and whitespace-insensitively | unit |
| AC-TAGS-12 | T2 | listNotesByTag returns [] when nothing matches | unit |
| AC-TAGS-13 | T2 | listNotesByTag returns copies | unit |
| AC-TAGS-14 | T2 | listNotesByTag rejects missing, non-string or blank tag | unit |
| AC-TAGS-15 | T1, T2 | existing test/notes.test.js (unchanged); text is validated before tags | unit |
| AC-TAGS-16 | T2 (impl of `copyNote` in T1) | list results do not share tags arrays with the store | unit |

## Commits (proposed; created only on the user's request)
| Commit | Tasks | Message |
|---|---|---|
| C1 | T1 | `feat(notes): add optional normalized tags to addNote` |
| C2 | T2 | `feat(notes): add listNotesByTag and copy tags in list results` |

## Order (and what may run in parallel)
T1 → T2, one after the other. Both edit `src/notes.js` and `test/note-tags.test.js`, so nothing runs in parallel.

## Final verification (commands; manual checks left to the user)
- `npm test`: every test in `test/notes.test.js` and `test/note-tags.test.js` passes.
- Manual: `git diff main -- test/notes.test.js package.json` is empty (AC-TAGS-15, no dependency changes).

## For reviewers (architecture-reviewer, plan-verifier)
- architecture-reviewer: check that `normalizeTag` is used by both `addNote` and `listNotesByTag` (one normalization rule), and that all validation runs before `nextId++`. Check that `addNote` still returns the stored object (D13) while both list functions return deep-enough copies (D5).
- plan-verifier: map each spec §13 scenario T1–T14 to the named test, and confirm `test/notes.test.js` is unmodified.

## Unknowns
- None blocking. A1 (separate test file) is an interpretation of AC-TAGS-15, and the user can override it.

## Limitations
- The profile's skill map has no skills for plain-JS / `node:test` modules, so the work follows CLAUDE.md only.
- A2 (process isolation per test file) comes from Node's documented default behaviour. I did not check it against the Node version actually installed here, and it does not affect correctness, because every file resets the store.
- Files read: `D:/AI/sdd-consumer-demo/specs/note-tags/spec.md`, `D:/AI/sdd-consumer-demo/src/notes.js`, `D:/AI/sdd-consumer-demo/test/notes.test.js`, `D:/AI/sdd-consumer-demo/package.json`, `D:/AI/sdd-consumer-demo/CLAUDE.md`.
