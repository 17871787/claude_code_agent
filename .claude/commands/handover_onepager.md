# handover_onepager
Objective: Create a one‑page handover per account.

INPUTS
- registry/ops/actions.json
- inputs/acme-q4/contacts.md
- inputs/acme-q4/deliverables.md
- inputs/acme-q4/cadence.md
- inputs/acme-q4/risks.md

STRUCTURE (exact)
# Handover — acme-q4
Contacts (primary/backup, roles, emails)
Comms cadence (meetings, report days)
Current deliverables (name, owner, due date)
Open actions (owner, next step, ETA)
Risks (severity, owner, mitigation)
Key dates (milestones next 4 weeks)
Links (tracker, repo, dashboards)

RULES
- No new claims. If unknown: "UNKNOWN".
- Keep to one page.

OUTPUT → registry/ops/handover_acme-q4.md