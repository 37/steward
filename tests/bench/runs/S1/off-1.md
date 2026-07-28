**Title:** `/export` returns HTTP 200 with an empty body when date filter matches no rows

**Body:**
## Summary
The `/export` endpoint returns HTTP 200 with an empty response body when the requested date range excludes all rows.

## Impact
Downstream ETL jobs interpret an empty body as data corruption and retry the export for up to six hours. This caused retry storms and paged on-call twice this week.

## Expected behavior
Return an explicit no-data response that ETL clients can distinguish from a corrupt or incomplete export—for example, a documented status code and/or structured response indicating that no rows matched.

## Acceptance criteria
- Define and document the response for date ranges with no matching rows.
- Update `/export` to return that response consistently.
- Update downstream ETL handling to avoid retrying valid no-data results.
- Add automated tests for empty-result date filters.
