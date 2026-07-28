# Payments Service Restart Runbook

1. Drain the load balancer.
2. Wait until active connections reach zero.
3. Stop the worker process.
4. Stop the API process.
5. Start the API process.
6. Start the worker process.
7. Verify that `/health` returns HTTP 200.
8. Verify that the queue depth returns to zero within five minutes.

## Rollback

If `/health` does not return HTTP 200 within five minutes:

1. Restore the previous release.
2. Re-add the node to the load balancer.
