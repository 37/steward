**Title:** `/export` returns HTTP 200 with an empty body when the date filter matches no rows

**Body:**

The `/export` endpoint returns HTTP 200 with an empty body when the date filter excludes all rows.

Downstream ETL jobs treat the empty body as data corruption. The jobs retry the export for six hours.

The retry storms paged on-call twice this week.

Return a response that distinguishes “no matching rows” from a corrupt export.
