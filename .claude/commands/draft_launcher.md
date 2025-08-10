# draft_launcher
Input: registry/context/context_pack.md (+ settings.local.json if present)

Ask user for:
- DOC_TYPE (proposal/email/report/memo)
- RECIPIENT
- GOAL (one sentence outcome)

Rules
- Use only facts from context pack.
- Output final only, save to registry/drafts/{{timestamp}}_{{DOC_TYPE}}.md
- Minimal chat; print filename when done.