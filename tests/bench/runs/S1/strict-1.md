**Title:** `/export` returns HTTP 200 with an empty body when no rows match the date filter

**Body:**

### Observed behavior

When the date filter excludes all rows, `/export` returns HTTP 200 with an empty body.

### Impact

Downstream ETL jobs treat the empty body as data corruption.  
The jobs retry the export for six hours.  
On-call received two pages this week because of retry storms.

### Expected behavior

Return an explicit no-data response that ETL jobs can handle without retries.  
Document the response contract for exports with no matching rows.
