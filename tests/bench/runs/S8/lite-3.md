```python
import hashlib


def sha256_file(path: str) -> str:
    digest = hashlib.sha256()

    with open(path, "rb") as file:
        while chunk := file.read(64 * 1024):
            digest.update(chunk)

    return digest.hexdigest()
```

Usage: Call `sha256_file("path/to/file")` to read the file in 64 KB chunks and return its SHA-256 digest as a lowercase hexadecimal string.
