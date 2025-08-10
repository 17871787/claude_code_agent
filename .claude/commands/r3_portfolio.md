# R3 Portfolio Command

## Objective
Select 3-5 complementary ideas for implementation portfolio.

## Inputs
- `registry/scoring/final_scores.json`
- All finalist ideas from `registry/ideas/*.json`

## Steps
1. Analyze final scores and complementarity
2. Select 3-5 ideas balancing: quick wins, strategic plays, risk coverage
3. Ensure selected set has synergies
4. Write selection rationale
5. Generate build briefs for each

## Outputs
- `registry/scoring/final_selection.json` with selected portfolio
- `registry/ideas/_selected/{idea_id}_brief.md` for each selected idea

## Claude Code Terminal Prompt
Read registry/scoring/final_scores.json and finalist ideas, select 3-5 complementary ideas optimizing for portfolio balance (quick wins + strategic value + risk mitigation), write selection to registry/scoring/final_selection.json, then create a 1-page implementation brief for each selected idea in registry/ideas/_selected/{idea_id}_brief.md format.