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

## Phase 4: Data Population
- [x] Task: Populate Lighthouse Metadata (31b94cd)
    - [x] Create a script to populate height, year, and characteristics for existing lighthouses
    - [x] Execute the population script on the database
- [~] Task: Conductor - User Manual Verification 'Data Population' (Protocol in workflow.md)
