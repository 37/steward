**Title:** `/export` returns HTTP 200 with an empty body when no rows match the date filter

**Body:**

The `/export` endpoint returns HTTP 200 with an empty body when the date filter excludes all rows.

Downstream ETL jobs treat the empty body as data corruption and retry the export for six hours. These retry storms paged the on-call engineer twice this week.

Return a clear no-data response that downstream jobs can handle without retries.
