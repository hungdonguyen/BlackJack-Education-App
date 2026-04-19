param(
    [string]$InputDir = "public/sounds/bgm",
    [switch]$DeleteOriginal
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Error "ffmpeg is required but was not found in PATH. Install ffmpeg first."
}

$root = Split-Path -Parent $PSScriptRoot
$sourceDir = Join-Path $root $InputDir

if (-not (Test-Path -LiteralPath $sourceDir)) {
    Write-Error "Input directory not found: $sourceDir"
}

$mp3Files = Get-ChildItem -LiteralPath $sourceDir -Filter *.mp3 -File
if ($mp3Files.Count -eq 0) {
    Write-Output "No mp3 files found in $sourceDir"
    exit 0
}

foreach ($file in $mp3Files) {
    $base = [System.IO.Path]::Combine($file.DirectoryName, [System.IO.Path]::GetFileNameWithoutExtension($file.Name))
    $oggOut = "$base.ogg"
    $webmOut = "$base.webm"

    Write-Output "Transcoding: $($file.Name)"

    & ffmpeg -y -i $file.FullName -vn -c:a libopus -b:a 128k -vbr on $oggOut | Out-Null
    & ffmpeg -y -i $file.FullName -vn -c:a libopus -b:a 128k -vbr on $webmOut | Out-Null

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Transcode failed for $($file.Name)"
    }

    if ($DeleteOriginal) {
        Remove-Item -LiteralPath $file.FullName -Force
    }
}

Write-Output "Done. Generated .ogg and .webm BGM files in $sourceDir"
