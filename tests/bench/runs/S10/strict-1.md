**Bug: `deploy push` fails when VPN is enabled**

**Error:**
> Error 731 — we can't reach the registry, and the manifest wasn't uploaded.

**Steps to reproduce:**
1. Enable the VPN.
2. Run `deploy push`.

**Expected result:** The manifest uploads successfully.

**Actual result:** The command prints the error above.

**Workaround:** Disable the VPN, then retry `deploy push`.
