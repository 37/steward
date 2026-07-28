**Title:** Return a clear no-data response from `/export`

**Body:**

The `/export` endpoint returns HTTP 200 with an empty body when the date filter matches no rows.

Downstream ETL jobs treat the empty body as data corruption. The jobs retry the export for six hours. Retry storms paged the on-call team twice this week.

Please return a response that clearly indicates that no rows match the date filter. Update the ETL jobs to handle this response without retries.
