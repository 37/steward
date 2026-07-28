## Upstream Pull Request Notes

- **Bug:** The CLI crashed when the config file contained a BOM.
- **Root cause:** The loader read the file as raw bytes and passed the BOM to the JSON parser.
- **Fix:** The loader now strips the BOM before parsing.
- **Rejected alternative:** Patch the JSON parser. The parser is vendored, so updates could erase the patch.
- **Rejected alternative:** Document the limitation. Windows editors add a BOM by default.
- **Compatibility:** No public API changes.
