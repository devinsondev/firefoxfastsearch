"""Build a loadable extension ZIP with manifest.json at archive root."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

root = Path(__file__).resolve().parents[1]
extension = root / "extension"
version = json.loads((extension / "manifest.json").read_text())["version"]
destination = root / "dist" / f"firefoxfastsearch-{version}.zip"
destination.parent.mkdir(exist_ok=True)
with ZipFile(destination, "w", ZIP_DEFLATED) as archive:
    for path in sorted(extension.rglob("*")):
        if path.is_file():
            archive.write(path, path.relative_to(extension))
print(f"Built {destination} ({destination.stat().st_size} bytes)")
