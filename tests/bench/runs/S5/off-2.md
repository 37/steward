# Payments Service Restart Runbook

1. **Drain the load balancer**
   - Remove the node from service and wait until active connections reach zero.

2. **Stop processes**
   - Stop the worker process first.
   - Then stop the API process.

3. **Start processes**
   - Start the API process first.
   - Then start the worker process.

4. **Verify**
   - Confirm `/health` returns HTTP `200`.
   - Confirm the queue depth returns to zero within five minutes.

## Rollback

If `/health` does not return HTTP `200` within five minutes:

1. Restore the previous release.
2. Re-add the node to the load balancer.
