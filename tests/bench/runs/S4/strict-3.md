## Pull Request Notes

### Bug

The CLI crashes when the configuration file contains a BOM.

### Root Cause

The loader reads the file as raw bytes. The JSON parser then receives the BOM bytes.

### Fix

The loader now strips the BOM before parsing.

### Rejected Alternatives

1. Patch the JSON parser. The parser is vendored, and future updates would erase the patch.
2. Document the limitation. Windows editors add the BOM by default.

### Compatibility

This change does not modify the public API.
