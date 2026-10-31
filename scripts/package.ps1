# Build an AMO-safe ZIP on Windows PowerShell 5.1+ (no Python required).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$extension = Join-Path $root 'extension'
$version = (Get-Content -LiteralPath (Join-Path $extension 'manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json).version
$dist = Join-Path $root 'dist'
New-Item -ItemType Directory -Path $dist -Force | Out-Null
$destination = Join-Path $dist "firefoxfastsearch-$version.zip"
if (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination -Force }
$files = @(Get-ChildItem -LiteralPath $extension -File -Recurse | Sort-Object FullName)
try {
    $zip = [IO.Compression.ZipFile]::Open($destination, [IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($file in $files) {
            $name = $file.FullName.Substring($extension.Length + 1).Replace('\', '/')
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $zip, $file.FullName, $name, [IO.Compression.CompressionLevel]::Optimal
            ) | Out-Null
        }
    } finally { $zip.Dispose() }
    $verification = [IO.Compression.ZipFile]::OpenRead($destination)
    try {
        $names = @($verification.Entries | ForEach-Object FullName)
        if ('manifest.json' -notin $names -or $names.Count -ne $files.Count -or
            @($names | Where-Object { $_.Contains('\') -or $_.StartsWith('/') }).Count) {
            throw 'AMO ZIP validation failed: invalid names or missing files.'
        }
    } finally { $verification.Dispose() }
} catch {
    Remove-Item -LiteralPath $destination -Force -ErrorAction SilentlyContinue
    throw
}
Write-Host "Built $destination ($($files.Count) files)"
