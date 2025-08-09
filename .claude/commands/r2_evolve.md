# R2 Evolve Command

## Objective
Refine ideas based on critiques to create stronger v2 concepts.

## Inputs
- All critiqued JSON files from `registry/ideas/*.json`

## Steps
1. Read critiqued ideas
2. Synthesize feedback into improvements
3. Evolve concepts addressing main concerns
4. Preserve original ideas
5. Write evolved versions as new files

## Outputs
- `registry/ideas/*-v2.json` files with evolved concepts

## Claude Code Terminal Prompt
Read all critiqued ideas from registry/ideas/, synthesize peer feedback to evolve each concept addressing raised concerns while preserving strengths, then write evolved versions as new *-v2.json files. Keep original files intact. Each evolved idea should show clear improvements based on critique integration.