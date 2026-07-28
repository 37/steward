```python
from hashlib import sha256
from pathlib import Path


def sha256_file(path: str | Path) -> str:
    digest = sha256()

    with open(path, "rb") as file:
        for chunk in iter(lambda: file.read(64 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()
```

Use `sha256_file("path/to/file")` to get the file SHA-256 digest as a lowercase hexadecimal string. The function reads the file in 64 KB chunks.
