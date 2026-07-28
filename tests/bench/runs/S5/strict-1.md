# Payments Service Restart Runbook

1. Drain the load balancer.
2. Wait until active connections reach zero.
3. Stop the worker process.
4. Stop the API process.
5. Start the API process.
6. Start the worker process.
7. Within five minutes, verify that `/health` returns `200`.
8. Within five minutes, verify that the queue depth returns to zero.

## Rollback

If `/health` does not return `200` within five minutes, restore the previous release.

Re-add the node to the load balancer.
