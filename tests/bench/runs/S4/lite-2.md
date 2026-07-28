## Summary

- Fix a CLI crash when the config file contains a BOM.
- Strip the BOM in the loader before JSON parsing.
- Keep the public API unchanged.

## Root Cause

The loader read the config file as raw bytes and passed the BOM bytes to the JSON parser.

## Rejected Alternatives

1. Patch the JSON parser. The parser is vendored, so future updates could remove the patch.
2. Document the limitation. Windows editors add BOMs by default, so this would not solve the problem.
