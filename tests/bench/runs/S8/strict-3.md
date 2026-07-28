```python
import hashlib

def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as file:
        for chunk in iter(lambda: file.read(64 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()
```

Use `sha256_file("path/to/file")` to get the file's SHA-256 hex digest.
