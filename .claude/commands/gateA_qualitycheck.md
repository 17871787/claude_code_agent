# gateA_qualitycheck
Objective: Score & shortlist the strongest drafts.

Input
- registry/docs/proposals/drafts_e1.jsonl

Steps
1) Weighted score: clarity .25, specificity .25, fit .30, risk(invert) .10, brevity .10
2) Keep top 2–3.

Outputs
- registry/docs/scoring/gateA.json
- registry/docs/scoring/gateA_candidates.json