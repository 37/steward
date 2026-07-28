**Deployment aborted: artifact checksum mismatch**

- Expected from the registry: `sha256:aaa111`
- Actual value from the built artifact: `sha256:bbb222`

Nothing was deployed. No server changes were made.

Remedies:

1. Rebuild the artifact.
2. Clear the local artifact cache.
3. Pull the artifact again.
4. Republish the registry entry if the entry is stale.

If the mismatch persists after a clean rebuild, treat the artifact as potentially tampered with. Do not deploy it. Contact the registry administrator.
