**Deploy aborted: artifact checksum mismatch**

- Expected (registry): `sha256:aaa111`
- Actual (built artifact): `sha256:bbb222`

Nothing changed on the servers.

Remedies:
1. Rebuild the artifact.
2. Clear the local artifact cache and pull it again.
3. Republish the registry entry if it is stale.

If the mismatch persists after a clean rebuild, treat the artifact as potentially tampered with. **Do not deploy it. Contact the registry administrator.**
