# Lighthouse API

Collection of enpoints used to retrieve lighthouses(Mostly in the US and Canada)

## Endpoints:

### /api/lighthouses

Base enpoint retrieves all lighthouses in the database

You can filter by state and country through query parameters

ex:
`/api/lighthouses?country=USA`
`/api/lighthouses?state=Florida`

## Deployment

Backend is deployed through github actions by building a docker container and uploading to azure web apps
