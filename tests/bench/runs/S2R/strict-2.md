**Deployment stopped: artifact checksum mismatch**

- Expected (registry): `sha256:aaa111`
- Actual (built artifact): `sha256:bbb222`

Nothing was deployed. No changes were made to the servers.

Remedies:

1. Rebuild the artifact.
2. Clear the local artifact cache.
3. Pull the artifact again.
4. Republish the registry entry if it is stale.

If the mismatch persists after a clean rebuild, treat the artifact as potentially tampered with. Do not deploy it. Contact the registry administrator.
