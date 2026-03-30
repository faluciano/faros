# Implementation Plan: Metadata Enhancement & Full Global Population

## Phase 1: Advanced OSM Processing
- [x] Task: Coordinate Centroid Logic (33521)
    - [x] Update `scripts/populate_data.ts` to handle Way/Relation elements
    - [x] Implement center-point calculation for building footprints
- [x] Task: Process All Elements (33521)
    - [x] Run local test import to verify entry count (~54k raw, ~10k pruned)
- [x] Task: Conductor - User Manual Verification 'OSM Processing' (Protocol in workflow.md)

## Phase 2: Metadata Extraction & Image Safety
- [x] Task: Image Preservation (33521)
    - [x] Update `INSERT` logic to check for existing images before replacing with placeholders
- [x] Task: Multi-Tag Mapping & Naming (33521)
    - [x] Implement exhaustive tag search for Year, Height, and Description
    - [x] Implement improved naming logic using `ref` and `reference` tags
    - [x] Implement pruning logic to remove unnamed/insignificant lights
- [x] Task: Conductor - User Manual Verification 'Extraction & Safety' (Protocol in workflow.md)

## Phase 3: Wikidata & Legal
- [x] Task: Wikidata API Client (33989)
    - [x] Implement utility to fetch data from Wikidata by ID
    - [x] Running background enrichment worker
- [x] Task: Attribution Data (33989)
    - [x] Add `source` field to database schema and populate with "OpenStreetMap" or "Wikidata"
- [x] Task: Conductor - User Manual Verification 'Wikidata & Legal' (Protocol in workflow.md)

## Phase 4: Full Cloud Population & Optimization
- [x] Task: Database Indexing (33521)
    - [x] Add/Verify indexes on `latitude`, `longitude`, and `isVisited` for 54k scale
- [~] Task: Execute Cloud Import
    - [ ] Run the final population script against Turso cloud (batched)
- [ ] Task: Conductor - User Manual Verification 'Full Population' (Protocol in workflow.md)
