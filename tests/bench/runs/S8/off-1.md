```python
import hashlib
from pathlib import Path


def sha256_file(path: str | Path) -> str:
    """Return the SHA-256 hex digest of a file."""
    digest = hashlib.sha256()

    with open(path, "rb") as file:
        while chunk := file.read(64 * 1024):
            digest.update(chunk)

    return digest.hexdigest()
```

Usage: call `sha256_file("path/to/file")`; it returns the file’s SHA-256 digest as a lowercase hexadecimal string.
