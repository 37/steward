**Deploy failed: artifact checksum mismatch.**

- Expected: `sha256:aaa111` from the registry
- Actual: `sha256:bbb222` from the built artifact

The deploy was aborted. No server changes were made.

To fix this:

1. Rebuild the artifact.
2. Clear the local artifact cache, then pull the artifact again.
3. Republish the registry entry if the registry entry is stale.

If the mismatch continues after a clean rebuild, treat the artifact as possibly tampered with. Do not deploy it. Contact the registry administrator.
