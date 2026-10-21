# Spec: Pinned notes
- **Key:** PIN · **Status:** Approved (2026-10-21) · **Date:** 2026-10-21 · **Areas:** src
- **Source request:** a 1.1.0 upgrade check: a spec approved under 1.0.0 rules where FR-2 has no acceptance criterion.

## 1. Goals
Let a note be pinned so that pinned notes are listed first.
## 2. Non-goals
Persistence, more than one pin level.
## 7. Functional requirements
- FR-1 `pinNote(id)` marks an existing note as pinned → AC-PIN-01
- FR-2 `listNotes()` returns pinned notes before unpinned ones, each group in insertion order
## 12. Acceptance criteria (EARS)
| AC-ID | EARS statement | Verification |
|---|---|---|
| AC-PIN-01 | When `pinNote` is called with an existing id, the notes module shall mark that note as pinned. | unit |
## 15. Open questions
none
## 16. Approvals required
none
