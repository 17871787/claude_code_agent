# action_extractor
Objective: From messy notes/transcripts, extract actions as strict JSON.

INPUT
- inputs/acme-q4/notes.md

RULES
- No invention. Only items explicit or strongly implied.
- If owner/date unknown → null.
- Keep status = "new"; risk ∈ {low,med,high}.

OUTPUT → registry/ops/actions.json
Schema:
[
  {"action":"", "context":"", "owner":null, "due_date":null, "status":"new", "dependency":null, "risk":"low"}
]