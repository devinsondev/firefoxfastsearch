"""Build an AMO-compatible ZIP with manifest.json at the archive root."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

root = Path(__file__).resolve().parents[1]
extension = root / "extension"
version = json.loads((extension / "manifest.json").read_text(encoding="utf-8"))["version"]
destination = root / "dist" / f"firefoxfastsearch-{version}.zip"
destination.parent.mkdir(exist_ok=True)
with ZipFile(destination, "w", ZIP_DEFLATED) as archive:
    for path in sorted(extension.rglob("*")):
        if path.is_file():
            # ZIP names must use forward slashes, even on Windows.
            archive.write(path, path.relative_to(extension).as_posix())

with ZipFile(destination) as archive:
    names = archive.namelist()
    if "manifest.json" not in names or any("\\" in name for name in names):
        destination.unlink(missing_ok=True)
        raise RuntimeError("Invalid AMO ZIP: manifest missing or Windows-style path separators")
    bad = archive.testzip()
    if bad:
        destination.unlink(missing_ok=True)
        raise RuntimeError(f"Corrupt file in ZIP: {bad}")

print(f"Built {destination} ({destination.stat().st_size} bytes)")
