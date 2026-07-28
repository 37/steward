## Upstream Pull Request Notes

### Bug

The CLI crashed when the config file contained a BOM.

### Root Cause

The loader read the file as raw bytes. The JSON parser then received the BOM bytes.

### Fix

The loader now strips the BOM before it parses the file.

### Rejected Alternatives

1. Patch the JSON parser. The parser is vendored, and future updates would erase the patch.
2. Document the limitation. Windows editors add a BOM by default, so this would not solve the problem.

### Compatibility

This change does not modify the public API.
