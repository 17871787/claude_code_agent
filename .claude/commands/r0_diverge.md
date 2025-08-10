# R0 Diverge Command

## Objective
Generate initial feature ideas from each agent perspective without constraints.

## Inputs
- `.claude/agents/*.md` (agent definitions)
- Project context from current state

## Steps
1. Load each agent definition
2. Generate 2 unique ideas per agent
3. Ensure ideas don't overlap significantly
4. Apply agent-specific perspective to each idea
5. Write to registry with proper JSON schema

## Outputs
- `registry/ideas/feature-visionary-{timestamp}.json`
- `registry/ideas/feasibility-realist-{timestamp}.json`
- `registry/ideas/ux-advocate-{timestamp}.json`

## Claude Code Terminal Prompt
Read all agent files from .claude/agents/, generate 2 distinct ideas per agent following their specific perspectives and guardrails, then write each agent's ideas as valid JSON to registry/ideas/{agent}-{timestamp}.json using the exact schema specified in each agent file. Each idea needs unique ID, clear summary, and initial scoring estimates.