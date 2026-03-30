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

## Phase 2: API and Documentation
- [~] Task: Update API Handlers
    - [ ] Write failing integration tests for lighthouse handlers with new fields
    - [ ] Update `handlers/lighthouse.go` to handle new fields
- [ ] Task: Update API Documentation
    - [ ] Update Swagger comments in handlers
    - [ ] Regenerate Swagger docs (`swag init`)
- [ ] Task: Conductor - User Manual Verification 'API and Documentation' (Protocol in workflow.md)

## Phase 3: Frontend Integration
- [ ] Task: Update Frontend Types and API Hooks
    - [ ] Write failing tests for lighthouse API response parsing
    - [ ] Update `src/types.ts` and `src/hooks/useLighthouse.ts`
- [ ] Task: Update UI Components
    - [ ] Write failing unit tests for `LighthouseCard` and `LighthousePopover`
    - [ ] Update components to display new lighthouse specifications
- [ ] Task: Conductor - User Manual Verification 'Frontend Integration' (Protocol in workflow.md)
