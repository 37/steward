**Deploy failed: artifact checksum mismatch**

- Expected (registry): `sha256:aaa111`
- Actual (built artifact): `sha256:bbb222`

The deploy was aborted. Nothing changed on the servers.

Remedies:
- Rebuild the artifact.
- Clear the local artifact cache and pull it again.
- Republish the registry entry if it is stale.

If the mismatch continues after a clean rebuild, treat the artifact as possibly tampered with. Do not deploy it; contact the registry administrator.
