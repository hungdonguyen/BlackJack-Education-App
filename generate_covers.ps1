Add-Type -AssemblyName System.Drawing

function Generate-Cover {
    param(
        [string]$sourcePath,
        [string]$outputPath,
        [int]$width,
        [int]$height
    )

    $bitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Deep blue gradient background
    $rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 0, 0, 50),
        [System.Drawing.Color]::FromArgb(255, 0, 50, 150),
        45.0
    )
    $graphics.FillRectangle($brush, $rect)

    # Load source icon
    $fullSourcePath = (Get-Item $sourcePath).FullName
    $icon = [System.Drawing.Image]::FromFile($fullSourcePath)
    
    [float]$targetHeight = $height * 0.6
    [float]$targetWidth = $icon.Width * ($targetHeight / $icon.Height)
    
    if ($targetWidth -gt ($width * 0.8)) {
        $targetWidth = $width * 0.8
        $targetHeight = $icon.Height * ($targetWidth / $icon.Width)
    }

    [float]$x = ($width - $targetWidth) / 2
    [float]$y = ($height - $targetHeight) / 2

    # Draw soft glow / shadow
    [float]$glowOffset = $height * 0.02
    $glowRect = New-Object System.Drawing.RectangleF(($x - $glowOffset), ($y - $glowOffset), ($targetWidth + 2 * $glowOffset), ($targetHeight + 2 * $glowOffset))
    $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(50, 0, 0, 0))
    $graphics.FillEllipse($glowBrush, $glowRect)

    # Draw icon
    $graphics.DrawImage($icon, $x, $y, $targetWidth, $targetHeight)

    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $icon.Dispose()
    $brush.Dispose()
    $glowBrush.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
}

if (-not (Test-Path "marketing/itch-assets")) { New-Item -ItemType Directory -Path "marketing/itch-assets" -Force }

Generate-Cover "src-tauri/icons/icon.png" "marketing/itch-assets/cover-630x500.png" 630 500
Generate-Cover "src-tauri/icons/icon.png" "marketing/itch-assets/cover-1260x1000.png" 1260 1000

# Report sizes
$results = Get-ChildItem "marketing/itch-assets/cover-*" | ForEach-Object {
    $bmp = New-Object System.Drawing.Bitmap($_.FullName)
    $dim = "$($bmp.Width)x$($bmp.Height)"
    $bmp.Dispose()
    [PSCustomObject]@{
        Name = $_.Name
        Dimensions = $dim
        "Size(KB)" = [math]::Round($_.Length / 1KB, 2)
    }
}
$results | Format-Table -AutoSize
