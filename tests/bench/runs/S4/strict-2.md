## Pull Request Notes

### Bug

The CLI crashes when the configuration file contains a BOM.

### Root Cause

The loader reads the file as raw bytes. The JSON parser then receives the BOM bytes.

### Fix

The loader now strips the BOM before it parses the file.

### Rejected Alternatives

- Patching the JSON parser was rejected because it is vendored. Future updates would erase the patch.
- Documenting the limitation was rejected because Windows editors add BOMs by default.

### Compatibility

This change does not modify the public API.
