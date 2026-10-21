# note-pinning — test fixture

`spec.md` here is **intentionally incomplete** and is **not a feature to build**.

- FR-2 has no acceptance criterion on purpose.
- `Status: Approved` imitates a spec approved under the sdd-engineering 1.0.0 rules.

It checks that sdd-engineering 1.1.0 and later stops `/run-plan note-pinning --from plan`
before planning and names FR-2 as the gap. Results are in
[docs/plugin-upgrade-1.1.0.md](../../docs/plugin-upgrade-1.1.0.md).

Do not add an acceptance criterion or run the workflow on it to completion: that would
remove the fixture's purpose.
