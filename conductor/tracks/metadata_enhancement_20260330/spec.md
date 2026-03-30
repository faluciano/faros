# Track Specification: Metadata Enhancement & Full Global Population

## Context
The current dataset of ~11,000 lighthouses only includes OpenStreetMap "Nodes." The full dataset contains ~54,000 entries. A background image sourcing script is currently running to replace placeholders with real photos.

## Goal
Expand the dataset to include all 54,614 entries while maximizing metadata richness, ensuring performance at scale (54k+ markers), and maintaining legal compliance (OSM/Wikidata attribution).

## Requirements

### 1. Advanced OSM Processing & Shape Handling
- Update `scripts/populate_data.ts` to process "Way" and "Relation" elements.
- Implement centroid calculation for non-point geometries.

### 2. Image Preservation Logic
- **CRITICAL:** The import script MUST NOT overwrite existing real image URLs (those that don't match `%via.placeholder.com%`) with placeholders during the full re-population. This ensures the work of the background image worker is preserved.

### 3. Metadata Extraction Refinement
- Expand tag mapping for Year Built, Height, and Description.
- Normalization of ISO country/state codes.
- **Improved Naming Logic:** Use `ref`, `seamark:light:reference`, or `description` as fallbacks for missing names to avoid numeric "Lighthouse 123" titles.
- **Data Quality Pruning:** Delete entries that lack a human-friendly name unless they have a linked Wikipedia/Wikidata entry or a physical height over 5m (filtering out minor pole lights).

### 4. Performance Optimization (Scale: 54k+)
- Ensure database indexes are optimized for global spatial queries.
- Validate that the clustered map frontend handles 54k+ markers smoothly.

### 5. Wikidata Integration
- Use `wikidata` tags to fetch high-authority metadata (inception date, material, architect).

### 6. Legal Compliance & Attribution
- Add ODbL (OpenStreetMap) and CC-BY-SA (Wikidata) attribution to the project's data metadata or "About" section.
- Ensure all imported records store their original source (OSM/Wikidata) for attribution.
