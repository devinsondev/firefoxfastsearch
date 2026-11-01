"""Reject AMO ZIP files with backslashes, unsafe paths, or incorrect contents."""
from pathlib import Path
from zipfile import ZipFile
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
EXTENSION = ROOT / "extension"


def archive_path():
    version = json.loads((EXTENSION / "manifest.json").read_text(encoding="utf-8"))["version"]
    return ROOT / "dist" / f"firefoxfastsearch-{version}.zip"


def verify(destination, extension=EXTENSION):
    expected = {path.relative_to(extension).as_posix(): path
                for path in extension.rglob("*") if path.is_file()}
    with ZipFile(destination) as archive:
        entries = archive.namelist()
        if len(entries) != len(set(entries)):
            raise ValueError("Duplicate filenames in ZIP")
        if "manifest.json" not in entries:
            raise ValueError("manifest.json is not at the ZIP root")
        if any("\\" in name or name.startswith("/") or name.startswith("./")
               or ".." in name.split("/") for name in entries):
            raise ValueError("ZIP contains invalid Windows-style or unsafe filenames")
        if set(entries) != set(expected):
            missing = sorted(set(expected) - set(entries))
            extra = sorted(set(entries) - set(expected))
            raise ValueError(f"Incorrect ZIP contents: missing={missing}, extra={extra}")
        corrupt = archive.testzip()
        if corrupt:
            raise ValueError(f"Corrupt ZIP entry: {corrupt}")
        for name, path in expected.items():
            if archive.read(name) != path.read_bytes():
                raise ValueError(f"ZIP content differs from source: {name}")
    return len(expected)


if __name__ == "__main__":
    location = Path(sys.argv[1]) if len(sys.argv) > 1 else archive_path()
    print(f"Verified {verify(location)} AMO ZIP files: {location}")
