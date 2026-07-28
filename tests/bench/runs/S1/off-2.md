**Title:** `/export` returns HTTP 200 with empty body when date filter matches no rows

**Body:**

### Summary
When the `/export` endpoint’s date filter excludes all rows, it returns HTTP 200 with an empty response body.

### Impact
Downstream ETL jobs interpret an empty body as data corruption and retry the export for up to six hours. This has caused retry storms and paged on-call twice this week.

### Expected behavior
Return an explicit, unambiguous no-data response—for example, a documented empty export format or an appropriate status such as `204 No Content`—that ETL consumers can handle without retrying.

### Reproduction
1. Call `/export` with a date range containing no rows.
2. Observe HTTP `200` with an empty body.

### Acceptance criteria
- Define and document the no-results response behavior.
- Update `/export` to return that response consistently.
- Update downstream ETL handling to avoid retries for valid empty results.
- Add regression tests for date ranges with no matching rows.
