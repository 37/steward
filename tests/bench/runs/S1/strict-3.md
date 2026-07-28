**Title:** `/export` returns HTTP 200 with an empty body when no rows match

**Body:**

The `/export` endpoint returns HTTP 200 with an empty body when the date filter excludes all rows.

Downstream ETL jobs treat the empty body as data corruption. The jobs retry the export for six hours.

These retry storms paged on-call twice this week.

**Expected behavior:**

Return an explicit no-data response that downstream ETL jobs can handle without retries. Document the response contract.

**Acceptance criteria:**

- Define the response for exports with no matching rows.
- Update the endpoint to return the defined response.
- Update ETL handling to stop retries for valid empty results.
- Add tests for date filters with no matching rows.
