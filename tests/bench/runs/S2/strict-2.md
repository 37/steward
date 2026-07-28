**Deploy failed: artifact checksum mismatch**

- Expected checksum from the registry: `sha256:aaa111`
- Actual checksum from the built artifact: `sha256:bbb222`

The deploy was aborted. Nothing changed on the servers.

To resolve the issue:

1. Rebuild the artifact.
2. Clear the local artifact cache and pull the artifact again.
3. Republish the registry entry if the entry is stale.

If the mismatch continues after a clean rebuild, treat the artifact as possibly tampered with. Do not deploy it. Contact the registry administrator.
