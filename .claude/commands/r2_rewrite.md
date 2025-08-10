# r2_rewrite
Objective: Merge critiques into evolved drafts.

Inputs
- registry/docs/proposals/drafts.jsonl
- registry/docs/_work/tone_notes.jsonl
- registry/docs/_work/objections.jsonl
- registry/docs/_work/merge_plan.jsonl

Steps
1) Apply edits and objections.
2) Recalculate scores; add evolved_from.

Output (JSONL)
- registry/docs/proposals/drafts_e1.jsonl