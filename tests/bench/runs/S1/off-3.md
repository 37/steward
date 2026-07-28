**Title:** `/export` returns HTTP 200 with an empty body when date filter matches no rows

**Body:**
## Description
When the `/export` endpoint’s date filter excludes all rows, it returns HTTP 200 with an empty response body.

Downstream ETL jobs interpret an empty body as data corruption and retry the export for up to six hours. These retry storms paged on-call twice this week.

## Expected behavior
Return an unambiguous no-data response, such as a documented empty export format, `204 No Content`, or another status/body that downstream consumers can distinguish from corrupted output.

## Impact
- ETL jobs retry unnecessarily for six hours.
- Retry storms create operational load.
- On-call was paged twice this week.
