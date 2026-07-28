## Upstream PR Notes

- **Bug:** The CLI crashes when the configuration file contains a UTF-8 BOM.
- **Root cause:** The loader reads the configuration as raw bytes and passes the BOM directly to the JSON parser.
- **Fix:** Strip the BOM in the loader before parsing.
- **Rejected alternatives:**
  1. Patch the JSON parser — it is vendored, so future updates would overwrite the patch.
  2. Document the limitation — Windows editors commonly add BOMs by default.
- **Compatibility:** No public API changes.
