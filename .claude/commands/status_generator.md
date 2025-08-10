# status_generator
Objective: Draft weekly status using a strict template from structured inputs.

INPUTS
- registry/ops/actions.json
- inputs/acme-q4/milestones.md
- inputs/acme-q4/risks.md
- inputs/acme-q4/next_week.md

TEMPLATE (exact)
Summary (3 bullets)
Progress (dated)
Risks & mitigations (owner, next step, date)
Next week (dated)
Decisions needed (if any)

RULES
- No speculative items. If info missing, write "TBD".
- UK English. One page.

OUTPUT → registry/ops/status_draft.md