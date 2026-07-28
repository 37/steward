## Pull Request Notes

### Bug

The CLI crashes when the configuration file contains a BOM.

### Root Cause

The loader reads the file as raw bytes. The JSON parser then receives the BOM bytes.

### Fix

The loader strips the BOM before it parses the file.

### Rejected Alternatives

- Patch the vendored JSON parser. Future parser updates could erase the patch.
- Document the limitation. Windows editors add BOMs by default.

### Compatibility

This change does not modify the public API.
