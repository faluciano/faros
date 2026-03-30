# Implementation Plan: Metadata Enhancement & Full Global Population

## Phase 1: Advanced OSM Processing
- [x] Task: Coordinate Centroid Logic (33521)
    - [x] Update `scripts/populate_data.ts` to handle Way/Relation elements
    - [x] Implement center-point calculation for building footprints
- [x] Task: Process All Elements (33521)
    - [x] Run local test import to verify entry count (~54k raw, ~10k pruned)
- [x] Task: Spatial Deduplication (39284)
    - [x] Implement logic to identify lighthouses within 50m of each other
    - [x] Merge metadata from duplicates (favoring Wikidata/Ways)
    - [x] Preserve the best image (real photo > placeholder)
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
- [x] Task: Execute Cloud Import (34119)
    - [x] Run the final population script against Turso cloud (batched)
- [x] Task: Conductor - User Manual Verification 'Full Population' (Protocol in workflow.md)

## Phase 5: Advanced Image Sourcing & Legal Compliance
- [x] Task: Image Attribution Schema (41985)
    - [x] Add columns for `image_author`, `image_license`, and `image_url` to the database schema
    - [x] Update frontend components (`LighthouseCard`, `LighthousePopover`) to display image attribution
- [x] Task: Wikipedia Article Image Sourcing (42095)
    - [x] Create script to fetch "Page Images" and attribution metadata from Wikimedia Commons API
    - [x] Update database with high-res Wikipedia thumbnails and license info
    - [x] **Strict Typing:** Ensure script uses interfaces and avoids `any`
- [ ] Task: Localized Keyword Search
    - [ ] Implement language-aware search (Phare, Faro, Leuchtturm) based on country
    - [ ] **Error Handling:** Add robust retry/timeout logic following project standards
- [ ] Task: Execute Advanced Sourcing
    - [ ] Run the worker in the background and monitor logs
- [ ] Task: Conductor - User Manual Verification 'Advanced Sourcing & Legal' (Protocol in workflow.md)
