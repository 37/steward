# Payments Service Restart Runbook

1. Drain the load balancer. Wait until active connections reach zero.
2. Stop the worker process first. Then stop the API process.
3. Start the API process first. Then start the worker process.
4. Verify that `/health` returns `200`. Verify that the queue depth returns to zero within five minutes.

## Rollback

If `/health` does not return `200` within five minutes, restore the previous release. Re-add the node to the load balancer.
