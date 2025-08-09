# Gate A Quickscore Command

## Objective
Apply scoring weights to filter top 60-70% of ideas.

## Inputs
- All idea files from `registry/ideas/*.json`

## Steps
1. Load all current ideas (original and v2)
2. Apply scoring weights: novelty(0.25), feasibility(0.25), impact(0.3), risk(0.1 inverted), composability(0.1)
3. Calculate total scores
4. Sort by total score
5. Keep top 60-70%, retire others

## Outputs
- `registry/scoring/quick_scores.json` with all scores
- Move bottom 30-40% to `registry/ideas/_retired/`

## Claude Code Terminal Prompt
Read all JSON files from registry/ideas/, calculate weighted total scores using novelty(0.25) + feasibility(0.25) + impact(0.3) + (1-risk)(0.1) + composability(0.1), sort by total, keep top 60-70% of ideas, move others to registry/ideas/_retired/, and write full scoring report to registry/scoring/quick_scores.json.