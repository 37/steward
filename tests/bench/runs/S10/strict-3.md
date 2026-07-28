I cannot access the issue tracker from this session. Use this bug report:

**Title:** `deploy push` fails when the VPN is on

**Actual result:**  
`deploy push` prints: “Error 731 — we can't reach the registry, and the manifest wasn't uploaded.”

**Condition:**  
The error occurs only when the VPN is on.

**Workaround:**  
Retry `deploy push` with the VPN off.

**Expected result:**  
The command uploads the manifest successfully when the VPN is on.
