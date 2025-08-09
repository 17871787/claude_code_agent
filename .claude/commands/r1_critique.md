# R1 Critique Command

## Objective
Cross-pollinate ideas through peer review to strengthen concepts.

## Inputs
- All JSON files in `registry/ideas/*.json`

## Steps
1. Load all generated ideas
2. Each agent critiques ideas from other agents
3. Add constructive challenges and improvement suggestions
4. Identify synergies between ideas
5. Append critiques to idea objects

## Outputs
- Updated JSON files with `peer_critiques` array added to each idea

## Claude Code Terminal Prompt
Read all JSON files from registry/ideas/, have each agent critique ideas from other agents (feature-visionary critiques feasibility-realist and ux-advocate ideas, etc.), then append a peer_critiques array to each idea object containing constructive feedback and synergy opportunities. Save updated files preserving original names.