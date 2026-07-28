```python
from pathlib import Path
import hashlib

def sha256_file(path: str | Path) -> str:
    """Return the SHA-256 hex digest of a file."""
    digest = hashlib.sha256()

    with open(path, "rb") as file:
        while chunk := file.read(64 * 1024):
            digest.update(chunk)

    return digest.hexdigest()
```

Usage: call `sha256_file("path/to/file")`; the function reads the file in 64 KB binary chunks and returns its SHA-256 digest as a lowercase hexadecimal string.
