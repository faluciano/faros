# Implementation Plan: Metadata Enhancement & Full Global Population

## Phase 1: Advanced OSM Processing
- [ ] Task: Coordinate Centroid Logic
    - [ ] Update `scripts/populate_data.ts` to handle Way/Relation elements
    - [ ] Implement center-point calculation for building footprints
- [ ] Task: Process All Elements
    - [ ] Run local test import to verify entry count (~54k)
- [ ] Task: Conductor - User Manual Verification 'OSM Processing' (Protocol in workflow.md)

## Phase 2: Metadata Extraction & Image Safety
- [ ] Task: Image Preservation
    - [ ] Update `INSERT` logic to check for existing images before replacing with placeholders
- [ ] Task: Multi-Tag Mapping
    - [ ] Implement exhaustive tag search for Year, Height, and Description
- [ ] Task: Conductor - User Manual Verification 'Extraction & Safety' (Protocol in workflow.md)

## Phase 3: Wikidata & Legal
- [ ] Task: Wikidata API Client
    - [ ] Implement utility to fetch data from Wikidata by ID
- [ ] Task: Attribution Data
    - [ ] Add `source` field to database schema and populate with "OpenStreetMap" or "Wikidata"
- [ ] Task: Conductor - User Manual Verification 'Wikidata & Legal' (Protocol in workflow.md)

## Phase 4: Full Cloud Population & Optimization
- [ ] Task: Database Indexing
    - [ ] Add/Verify indexes on `latitude`, `longitude`, and `isVisited` for 54k scale
- [ ] Task: Execute Cloud Import
    - [ ] Run the final population script against Turso cloud (batched)
- [ ] Task: Conductor - User Manual Verification 'Full Population' (Protocol in workflow.md)
