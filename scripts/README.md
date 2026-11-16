# Lighthouse data scripts

The lighthouse dataset the app serves lives in
`lighthouse-frontend/public/data/lighthouses/` and is committed. These scripts
change it by way of a scratch SQLite database.

Run everything from the repo root with [Bun](https://bun.sh):

```sh
bun install
bun run scripts/load_work_db.ts    # published files -> scripts/.work/lighthouses.db
bun run scripts/<script>.ts        # change the data
bun run scripts/export_static.ts   # working database -> published files
```

Then review the diff under `public/data/lighthouses/`, commit it, and deploy.

| Script | What it does |
| --- | --- |
| `load_work_db.ts` | Rebuilds the working database from the published files |
| `export_static.ts` | Writes the working database back out as the published files |
| `populate_data.ts` | Imports lighthouses from the OpenStreetMap extract in `global_lighthouses.json` |
| `enrich_wikidata.ts` | Fills in height, year built and descriptions from Wikidata |
| `source_images.ts` | Searches Wikimedia Commons for photos taken near lighthouses that have none. It takes the nearest file without checking it shows the lighthouse, so run `repair_images.ts` afterwards |
| `repair_images.ts` | Fixes photo references, removes images that are not of the lighthouse, and fills in each photo's author, licence and source page |
| `deduplicate.ts`, `check_duplicates.ts`, `audit_proximity.ts` | Find and merge duplicate entries |
| `prune_unnamed.ts` | Removes unnamed, insignificant entries |
| `db_audit.ts` | Prints coverage statistics |

The working database is a scratch copy: it is ignored by git and safe to delete.
