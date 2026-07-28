## Bug report

**Title:** `deploy push` fails when the VPN is on

**Description:** The command fails only when the VPN is on.

**Error:**
> Error 731 — we can't reach the registry, and the manifest wasn't uploaded.

**Workaround:** Retry the command with the VPN off.

**Expected result:** `deploy push` uploads the manifest successfully.
