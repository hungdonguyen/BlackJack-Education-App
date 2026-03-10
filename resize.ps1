Add-Type -AssemblyName System.Drawing
$srcPath = "c:\Users\Maytinh\Desktop\BlackJack_Web\public\images\logo\app\logo.png"
$dstPath = "c:\Users\Maytinh\Desktop\BlackJack_Web\public\images\logo\app\logo_square.png"

$srcImg = [System.Drawing.Image]::FromFile($srcPath)
$size = [math]::Max($srcImg.Width, $srcImg.Height)

$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)

# Draw image in center
$x = ($size - $srcImg.Width) / 2
$y = ($size - $srcImg.Height) / 2
$g.DrawImage($srcImg, $x, $y, $srcImg.Width, $srcImg.Height)

$bmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$srcImg.Dispose()
Write-Host "Image resized successfully to $dstPath"
