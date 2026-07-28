I can’t file the report directly because no repository or issue-tracking tools are available here.

**Bug report**

**Title:** `deploy push` fails when VPN is enabled

**Description:**  
The command `deploy push` prints:

> Error 731 — we can't reach the registry, and the manifest wasn't uploaded.

This happens only when the VPN is on.

**Workaround:** Retry `deploy push` with the VPN turned off.
