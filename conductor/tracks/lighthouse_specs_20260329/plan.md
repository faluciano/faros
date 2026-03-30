# Implementation Plan: Implement Detailed Lighthouse Specifications

## Phase 1: Backend and Database [checkpoint: 6febe51]
- [x] Task: Update Database Schema (97ae33b)
    - [x] Write failing test for new columns in DB schema
    - [x] Update SQL schema in `db/db.go`
- [x] Task: Update Backend Models (fe327d5)
    - [x] Write failing tests for lighthouse struct with new fields
    - [x] Update `schemas/lighthouse.go` with new struct fields
- [x] Task: Update Database Implementation (3e82e94)
    - [x] Write failing unit tests for DB queries with new fields
    - [x] Update `db/interface.go` and `db/db.go` implementation
- [x] Task: Conductor - User Manual Verification 'Backend and Database' (Protocol in workflow.md)

## Phase 2: API and Documentation [checkpoint: 4819231]
- [x] Task: Update API Handlers (6febe51 - No logic changes needed)
    - [x] Write failing integration tests for lighthouse handlers with new fields
    - [x] Update `handlers/lighthouse.go` to handle new fields
- [x] Task: Update API Documentation (8848f8e)
    - [x] Update Swagger comments in handlers
    - [x] Regenerate Swagger docs (`swag init`)
- [x] Task: Conductor - User Manual Verification 'API and Documentation' (Protocol in workflow.md)

## Phase 3: Frontend Integration [checkpoint: 47e2630]
- [x] Task: Update Frontend Types and API Hooks (c6a1cbd)
    - [x] Write failing tests for lighthouse API response parsing
    - [x] Update `src/types.ts` and `src/hooks/useLighthouse.ts`
- [x] Task: Update UI Components (6397bea)
    - [x] Write failing unit tests for `LighthouseCard` and `LighthousePopover`
    - [x] Update components to display new lighthouse specifications
- [x] Task: Conductor - User Manual Verification 'Frontend Integration' (Protocol in workflow.md)

## Phase 4: Data Population [checkpoint: a5554ef]
- [x] Task: Populate Lighthouse Metadata (31b94cd)
    - [x] Create a script to populate height, year, and characteristics for existing lighthouses
    - [x] Execute the population script on the database
- [x] Task: Conductor - User Manual Verification 'Data Population' (Protocol in workflow.md)

## Phase 5: Full Data Sourcing and Population [checkpoint: 568b174]
- [x] Task: Sourcing Lighthouse Dataset (568b174)
    - [x] Identify a comprehensive global lighthouse dataset (CSV/JSON/API)
    - [x] Prepare the dataset for import (mapping fields to our schema)
- [x] Task: Full Data Import (568b174)
    - [x] Update population script to handle the full dataset
    - [x] Execute the full population on the database
- [x] Task: Conductor - User Manual Verification 'Full Population' (Protocol in workflow.md)

## Phase: Review Fixes
- [x] Task: Apply review suggestions (8007111 and subsequent)
    - [x] Optimize API with summary and detail endpoints
    - [x] Optimize Frontend Map with clustering and GeoJSON layers
    - [x] Restore persistent backend unit tests

