# r0_draft
Objective: Create 2–4 proposal drafts from context.

Inputs
- .claude/agents/proposal-writer.md
- registry/context/context_pack.(md|json)
- inputs/acme-q4/*

Steps
1) Read context; identify goals, constraints, success criteria.
2) Generate 2–4 distinct drafts using JSONL schema below.
3) Fill rough scores; total = mean.

Output file (append JSONL): registry/docs/proposals/drafts.jsonl
Schema per line:
{"doc_id":"prop-A1","title":"string","hook":"string","sections":{"exec":"","outcomes":"","scope":"","timeline":"","team":"","pricing":"","risks":"","next_steps":""},"assumptions":[""],"proof_points":[""],"tone":"confident, practical","score":{"clarity":0,"specificity":0,"fit":0,"risk":0,"brevity":0,"total":0}}