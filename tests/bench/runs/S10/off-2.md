## Bug: `deploy push` fails when VPN is enabled

**Error (verbatim):**  
> Error 731 — we can't reach the registry, and the manifest wasn't uploaded.

**Steps to reproduce:**
1. Enable the VPN.
2. Run `deploy push`.

**Actual result:** The command fails with the error above.  
**Expected result:** The manifest is uploaded successfully.

**Workaround:** Retry `deploy push` with the VPN disabled.
