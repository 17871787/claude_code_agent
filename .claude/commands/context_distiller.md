# context_distiller
Objective: Merge inputs/ into a single context pack.

Read (if present)
- inputs/_profiles/*.md
- inputs/_glossary.md
- inputs/_proof.md
- inputs/_today.md
- inputs/acme-q4/brief.md
- inputs/acme-q4/constraints.md
- inputs/acme-q4/source.md
- inputs/acme-q4/contact.md

Write:
1) registry/context/context_pack.md (verbatim merged, structured)
2) registry/context/context_pack.json (compact fields)

Rules
- Preserve headings; no web lookups; no invented proof.
- If a file is missing, skip it.
- Minimal chat; print ✓ with two output paths.