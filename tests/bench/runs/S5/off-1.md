# Payments Service Restart Runbook

## Procedure

1. Drain the node from the load balancer and wait until active connections reach zero.
2. Stop the worker process first, then stop the API process.
3. Start the API process first, then start the worker process.
4. Verify:
   - The `/health` endpoint returns HTTP `200`.
   - Queue depth returns to zero within five minutes.

## Rollback

If `/health` does not return HTTP `200` within five minutes:

1. Restore the previous release.
2. Re-add the node to the load balancer.
