# Track Specification: Implement Detailed Lighthouse Specifications

## Context
Faros currently tracks lighthouse locations and basic visit status. Users want more detailed information about each lighthouse to enhance their experience and the project's data precision.

## Goal
Add detailed metadata to lighthouses, including:
- Height (meters)
- Year built
- Light characteristics (color, period, flash pattern)
- Historical context (short description)

## Requirements

### Backend
- Update database schema (Turso/SQLite) to include new columns in the `lighthouses` table.
- Update Go structs in `schemas/lighthouse.go` and handlers.
- Update database interface in `db/interface.go` and implementation in `db/db.go`.
- Ensure API endpoints (GET /lighthouses, GET /lighthouses/{id}, etc.) return and accept the new data.

### Frontend
- Update TypeScript interfaces in `src/types.ts`.
- Update `LighthouseCard` and `LighthousePopover` to display the new information.
- Update `LighthouseList` and `VisitedLighthouses` to show relevant details.
- Ensure the UI remains responsive and accessible (mobile-first) using Tailwind CSS.

### Testing
- Backend unit tests for new fields in models and database queries.
- Integration tests for API endpoints verifying correctly updated responses.
- Frontend unit tests for updated components with new data.
