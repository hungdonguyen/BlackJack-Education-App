param(
    [string]$InputDir = "public/sounds/bgm",
    [ValidateRange(24, 192)]
    [int]$WebmBitrateKbps = 72,
    [ValidateRange(24, 192)]
    [int]$OggBitrateKbps = 72,
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

$allowedExts = @('.wav', '.flac', '.m4a', '.aac', '.mp3', '.ogg', '.webm')
$sourcePriority = @('.wav', '.flac', '.m4a', '.aac', '.mp3', '.ogg', '.webm')

$allAudioFiles = Get-ChildItem -LiteralPath $sourceDir -File |
    Where-Object { $allowedExts -contains $_.Extension.ToLowerInvariant() }

if ($allAudioFiles.Count -eq 0) {
    Write-Output "No supported audio files found in $sourceDir"
    exit 0
}

$groups = $allAudioFiles | Group-Object -Property BaseName
$converted = 0

foreach ($group in $groups) {
    $selectedSource = $null

    foreach ($ext in $sourcePriority) {
        $candidate = $group.Group | Where-Object { $_.Extension.ToLowerInvariant() -eq $ext } | Select-Object -First 1
        if ($candidate) {
            $selectedSource = $candidate
            break
        }
    }

    if (-not $selectedSource) {
        continue
    }

    $base = Join-Path $selectedSource.DirectoryName $selectedSource.BaseName
    $oggOut = "$base.ogg"
    $webmOut = "$base.webm"
    $oggTmp = "$base.__tmp__.ogg"
    $webmTmp = "$base.__tmp__.webm"

    Write-Output "Transcoding: $($selectedSource.Name) -> $($selectedSource.BaseName).{ogg,webm}"

    # Opus at lower target bitrate reduces long-loop BGM size significantly on itch builds.
    & ffmpeg -y -i $selectedSource.FullName -vn -c:a libopus -b:a "$($OggBitrateKbps)k" -vbr on -compression_level 10 -application audio -frame_duration 60 $oggTmp | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "OGG transcode failed for $($selectedSource.Name)"
    }
    Move-Item -LiteralPath $oggTmp -Destination $oggOut -Force

    & ffmpeg -y -i $selectedSource.FullName -vn -c:a libopus -b:a "$($WebmBitrateKbps)k" -vbr on -compression_level 10 -application audio -frame_duration 60 $webmTmp | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "WEBM transcode failed for $($selectedSource.Name)"
    }
    Move-Item -LiteralPath $webmTmp -Destination $webmOut -Force

    if ($DeleteOriginal) {
        $selectedExt = $selectedSource.Extension.ToLowerInvariant()
        if ($selectedExt -notin @('.ogg', '.webm')) {
            Remove-Item -LiteralPath $selectedSource.FullName -Force
        }
    }

    $converted++
}

Write-Output "Done. Converted $converted track(s) in $sourceDir with OGG=${OggBitrateKbps}k and WEBM=${WebmBitrateKbps}k."
