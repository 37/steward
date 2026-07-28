```python
from hashlib import sha256
from pathlib import Path


def file_sha256(path: str | Path) -> str:
    digest = sha256()

    with open(path, "rb") as file:
        for chunk in iter(lambda: file.read(64 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()
```

Usage: Call `file_sha256("path/to/file")` with the file path. The function reads the file in 64 KB chunks and returns the SHA-256 digest as a lowercase hexadecimal string.
