# email_weekly_update
Objective: Convert the weekly status draft into a ≤150‑word client email.

INPUTS
- registry/ops/status_draft.md
- inputs/acme-q4/contacts.md  # optional
- inputs/acme-q4/cadence.md   # optional

RULES
- UK English. ≤150 words (excluding Subject).
- Structure:
  Subject
  Greeting (Name if known)
  3 bullets: Summary highlights (dated)
  1–2 sentences: Risks/asks (from source)
  CTA with 2 time options
  Sign‑off
- No invention. If data missing, write "TBD".

OUTPUTS
- registry/ops/email_weekly_subject.txt
- registry/ops/email_weekly_{{YYYYMMDD}}.md