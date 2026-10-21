# Verification — note-tags

Scope: spec specs/note-tags/spec.md (Key TAGS) · tasks T1, T2 · base `main` plus the uncommitted working tree.
All 16 tests (14 new, 2 existing) passed via `npm test` in the verifier's session.

## Matrix (SDD)
| AC-ID | Task | Implementation (src/notes.js) | Test (test/note-tags.test.js) | Commit | Status | Note |
|---|---|---|---|---|---|---|
| 01 | T1 | `addNote` / `normalizeTags` (undefined gives `[]`), ~L16-L38 | `addNote defaults tags to []`, :7, pass | not committed | PASS | |
| 02 | T1 | same | same test, :11-13, pass | not committed | PASS | |
| 03 | T1 | `normalizeTag` trim and lowercase, ~L5-L10 | `addNote trims and lowercases tags`, :16, pass | not committed | PASS | |
| 04 | T1 | `normalizeTags` dedupe via `includes`, ~L19-L24 | `addNote de-duplicates tags in first-occurrence order`, :21, pass | not committed | PASS | |
| 05 | T1 | `normalizeTags` builds a new array | `addNote does not keep the caller tags array`, :26, pass | not committed | PASS | |
| 06 | T1 | `normalizeTag` throws `tag is required` on blank | `addNote rejects blank tags without storing`, :34, pass | not committed | PASS | |
| 07 | T1 | `normalizeTag` type check before `.trim()` | `addNote rejects non-string tags without storing`, :40, pass | not committed | PASS | Includes sparse array case (amendment 2). |
| 08 | T1 | `Array.isArray` check, `tags must be an array` | `addNote rejects non-array tags and consumes no id`, :50, pass | not committed | PASS | |
| 09 | T1 | `normalizeTags` runs before `nextId++` | tests at :34, :40, :50, :58 assert `listNotes()` is `[]` and next id is 1; pass | not committed | PASS | |
| 10 | T2 | `listNotesByTag` filter, ~L48-L50 | `listNotesByTag returns matching notes in insertion order`, :71, pass | not committed | PASS | |
| 11 | T2 | `normalizeTag(tag)` in `listNotesByTag` | `listNotesByTag matches case- and whitespace-insensitively`, :76, pass | not committed | PASS | |
| 12 | T2 | filter returns `[]` | `listNotesByTag returns [] when nothing matches`, :81, pass | not committed | PASS | Empty and populated store. |
| 13 | T2 | `copyNote` | `listNotesByTag returns copies`, :87, pass | not committed | PASS | |
| 14 | T2 | `normalizeTag` | `listNotesByTag rejects missing, non-string or blank tag`, :94, pass | not committed | PASS | |
| 15 | T1, T2 | `text` check unchanged and first | `text is validated before tags`, :58; existing `addNote stores a trimmed note`, `addNote rejects empty text`, pass | not committed | PASS | `test/notes.test.js` and `package.json` unmodified. |
| 16 | T2 | `copyNote` used in `listNotes` and `listNotesByTag` | `list results do not share tags arrays with the store`, :101, pass | not committed | PASS | Placement in T2 (amendment 1) cannot be told apart from T1 in the combined working tree. |

## Traceability gaps
- No AC lacks a task or a test; no task lacks an AC.
- Spec scenario T13 (`addNote('', null)`) is covered in `text is validated before tags` (:60).
- Spec scenario T14 is covered by one test reading `listNotes()` once at the end; enough for AC-16.

## Checks run
| Command | Result |
|---|---|
| `npm test` | 16 pass, 0 fail |

## Out-of-plan changes
- None. The diff touches `src/notes.js`, new `test/note-tags.test.js`, and `specs/`.
- `copyNote` is declared after `addNote` (hoisted, harmless). The `eslint-disable` comment at test:45 is harmless.

## Protected paths
None touched.

## Summary: PASS 16 / PARTIAL 0 / MISSING 0

## Verdict
Spec satisfied. Traceability is incomplete until committed, because no commits exist yet (planned C1 for T1, C2 for T2).

## Limitations
- Nothing is committed, so the commit column holds no SHAs.
- The T1/T2 task split cannot be checked in the combined working tree.
- Line numbers in `src/notes.js` are approximate.
