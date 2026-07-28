```python
import hashlib


def sha256_file(path):
    digest = hashlib.sha256()

    with open(path, "rb") as file:
        for chunk in iter(lambda: file.read(64 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()
```

Pass the file path to `sha256_file()` to get its SHA-256 digest as a lowercase hexadecimal string.
