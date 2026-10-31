"""Build deterministic AMO-compatible ZIPs on Windows, Linux, and macOS."""
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo
from verify_package import verify, archive_path, EXTENSION


def build():
    destination = archive_path()
    destination.parent.mkdir(exist_ok=True)
    try:
        with ZipFile(destination, "w") as archive:
            for path in sorted(EXTENSION.rglob("*")):
                if not path.is_file():
                    continue
                # ZipFile.write() may normalize archive names as Windows paths.
                # writestr() preserves the supplied forward-slash name exactly.
                name = path.relative_to(EXTENSION).as_posix()
                info = ZipInfo(name, (2020, 1, 1, 0, 0, 0))
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                archive.writestr(info, path.read_bytes(), compress_type=ZIP_DEFLATED)
        count = verify(destination)
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    print(f"Built {destination} ({destination.stat().st_size} bytes, {count} files)")
    return destination


if __name__ == "__main__":
    build()
