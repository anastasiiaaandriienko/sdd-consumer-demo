# sdd-engineering 1.0.0 → 1.1.0 → stable 1.0.0 → 1.1.0

Run on 2026-10-22 in this repository with Claude Code 2.1.306, project scope.
Versions come from `claude plugin list --json` and the install records
(`installed_plugins.json`: version, git commit). Behaviour comes from `claude -p` traces
(`--output-format stream-json`; the `init` event lists the loaded plugins). Raw traces
stay on the operator's machine because they contain local paths.

## 1. Update to 1.1.0 (latest channel)

```sh
claude plugin marketplace update dev-digest-ai-marketplace
claude plugin update sdd-engineering@dev-digest-ai-marketplace --scope project
#   Plugin "sdd-engineering" updated from 1.0.0 to 1.1.0 for scope project
```

| Plugin | Before | After | Commit after |
|---|---|---|---|
| sdd-engineering | 1.0.0 | **1.1.0** | `7424230` (tag `sdd-engineering--v1.1.0`) |
| engineering-paved-path | 1.0.0 | 1.0.0 | `30809ef` |
| research-tools | 1.0.0 | 1.0.0 | `30809ef` |
| architecture-review | 1.0.0 | 1.0.0 | `30809ef` |

## 2. New behaviour: a requirement without an AC does not pass

`specs/note-pinning/spec.md` is marked `Approved` the way 1.0.0 allowed, but FR-2 has
no acceptance criterion. `check-spec.mjs` reports `FR-2 (line 11) has no acceptance
criterion` (exit 1).

`claude -p "/sdd-engineering:run-plan note-pinning --from plan"`:

- The trace loads `sdd-engineering@1.1.0` and its three dependencies at 1.0.0.
- The run stopped before planning. No subagent was called and no plan file was
  written. The reply named FR-2 as the gap and offered to send it to spec-creator for an
  AC. It said a new G1 approval would be needed.
- Cost: $0.129.

## 3. Rollback to the stable channel

```sh
claude plugin uninstall sdd-engineering@dev-digest-ai-marketplace --scope project --keep-data --prune -y
#   Removed 3 auto-installed plugins: engineering-paved-path, research-tools, architecture-review
claude plugin marketplace add https://raw.githubusercontent.com/anastasiiaaandriienko/dev-digest-ai-marketplace/main/channels/stable/.claude-plugin/marketplace.json --scope project
claude plugin install sdd-engineering@dev-digest-ai-marketplace-stable --scope project
```

| Plugin | Version | Commit |
|---|---|---|
| sdd-engineering@dev-digest-ai-marketplace-stable | **1.0.0** | `30809ef` (tag `sdd-engineering--v1.0.0`) |
| engineering-paved-path, research-tools, architecture-review @…-stable | 1.0.0 (`1.0.0-30809ef0df39`) | `30809ef` |

No plugin from the latest channel stayed installed. Smoke check in a new session: the
trace loads `sdd-engineering@1.0.0` and its dependencies, and all four SDD agents plus
researcher and architecture-reviewer are listed. A plain code question was answered
directly with no workflow (`text is required`, `src/notes.js:27-29`). Cost: $0.066.

## 4. Back to latest

```sh
claude plugin uninstall sdd-engineering@dev-digest-ai-marketplace-stable --scope project --keep-data --prune -y
claude plugin install sdd-engineering@dev-digest-ai-marketplace --scope project
```

Result: `sdd-engineering@dev-digest-ai-marketplace` **1.1.0** (`7424230`), with its
dependencies at 1.0.0. The stable marketplace stays declared in `.claude/settings.json`
for the next rollback. No plugin from it is installed.

## Notes

- **Plugin data.** sdd-engineering keeps no data in `${CLAUDE_PLUGIN_DATA}`; its state
  is `specs/` in this repository, which the channel switches did not touch. `--keep-data`
  was used anyway. The isolated rehearsal in the marketplace repository checks that
  data survives the round trip.
- **External state.** No files outside `specs/note-pinning/` and `.claude/settings.json`
  changed. Nothing was committed by the plugin.
- **Dependency commits.** After the return, the dependencies were installed from the
  marketplace checkout (`7424230`), not from their `--v1.0.0` tag commit (`30809ef`).
  Their content and version (1.0.0) are the same.
- **Defect found in 1.1.0.** `/run-plan` runs `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-spec.mjs"`
  with a quoted path. The skill's `allowed-tools` pattern is unquoted, so the command
  needed a permission prompt. The session fell back to the manual coverage check, as the
  skill specifies. To be fixed in a patch release.
- LLM spend for this check: $0.195.
