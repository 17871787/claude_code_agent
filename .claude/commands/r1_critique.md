# r1_critique
Objective: Tone + risk critique across drafts.

Inputs
- registry/docs/proposals/drafts.jsonl
- .claude/agents/tonekeeper.md
- .claude/agents/objection-handler.md

Steps
1) Tonekeeper → registry/docs/_work/tone_notes.jsonl
2) Objection Handler → registry/docs/_work/objections.jsonl
3) Produce merge plan → registry/docs/_work/merge_plan.jsonl

Output files
- registry/docs/_work/tone_notes.jsonl
- registry/docs/_work/objections.jsonl
- registry/docs/_work/merge_plan.jsonl