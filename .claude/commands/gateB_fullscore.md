# Gate B Fullscore Command

## Objective
Deep scoring analysis of finalist ideas with detailed reasoning.

## Inputs
- Remaining ideas in `registry/ideas/*.json` after Gate A

## Steps
1. Load all surviving ideas
2. Perform detailed scoring with reasoning notes
3. Consider implementation sequence and dependencies
4. Identify complementary idea sets
5. Generate final rankings

## Outputs
- `registry/scoring/final_scores.json` with detailed scoring and reasoning

## Claude Code Terminal Prompt
Read all non-retired ideas from registry/ideas/, perform comprehensive scoring with detailed reasoning for each dimension, identify dependencies and complementary sets, then write complete analysis to registry/scoring/final_scores.json including reasoning notes and implementation considerations.