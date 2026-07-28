## Pull Request Notes

### Bug
The CLI crashed when the configuration file contained a UTF-8 BOM.

### Root Cause
The loader read the configuration as raw bytes and passed the BOM directly to the JSON parser.

### Fix
Strip the BOM in the loader before parsing the configuration.

### Rejected Alternatives
- **Patch the JSON parser:** Rejected because the parser is vendored, and future vendor updates would overwrite the patch.
- **Document the limitation:** Rejected because Windows editors commonly add a BOM by default.

### Compatibility
No public API changes.
