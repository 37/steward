```python
import hashlib

def sha256_file(path: str) -> str:
    """Return the SHA-256 hex digest of the file at path."""
    digest = hashlib.sha256()
    with open(path, "rb") as file:
        while chunk := file.read(64 * 1024):
            digest.update(chunk)
    return digest.hexdigest()
```

Usage: Call `sha256_file("path/to/file")`; it reads the file incrementally in 64 KB binary chunks and returns the lowercase SHA-256 digest as a hexadecimal string.
