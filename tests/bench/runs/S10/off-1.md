I can’t file the report directly because repository tools aren’t available in this session. Draft:

**Title:** `deploy push` fails when VPN is enabled

**Description:**  
`deploy push` prints:

> Error 731 — we can't reach the registry, and the manifest wasn't uploaded.

This occurs only when the VPN is on. Retrying with the VPN off works.

**Expected:** The manifest uploads successfully while the VPN is enabled.
