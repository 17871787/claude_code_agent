# r3_finalize
Objective: Finalise proposal(s) + cover email(s) + checklist + auto-review.

Inputs
- registry/docs/scoring/gateA_candidates.json
- registry/context/context_pack.(md|json)
- inputs/acme-q4/contact.md (optional)
- registry/_review_checklist.md (for the review step)

Steps
1) Pick best 1–2 candidates; create polished Markdown proposals → registry/docs/final/proposal_*.md
2) Generate a cover email (≤180 words) per proposal → registry/docs/final/cover_email_*.md
3) Write one-page proposal checklist → registry/docs/final/checklist_*.md
4) Auto-run review: load registry/_review_checklist.md, evaluate each final file, write registry/docs/final/review_notes_{date}.md

Outputs
- registry/docs/final/proposal_*.md
- registry/docs/final/cover_email_*.md
- registry/docs/final/checklist_*.md
- registry/docs/final/review_notes_{date}.md