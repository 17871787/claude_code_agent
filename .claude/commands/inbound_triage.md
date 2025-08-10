# inbound_triage
Objective: Turn an inbound email dump into a safe reply + tasks.

Inputs
- registry/client/inbound_raw_20250810.md (you paste the email thread)
- context_pack_long_clawson.md
- contacts.md, cadence.md

Outputs
- registry/client/inbound_reply_20250810.md (≤180 words, subject/body)
- Append extracted actions → registry/client/actions.json
Guardrails: no promises; UNKNOWN if missing; cite evidence paths as needed.