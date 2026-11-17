param(
  [int]$TargetPid = 34068,
  [string]$OutFile = "C:\Users\ThinkPad\.dsh\bot\workspace\build_B1\materials\screenshot-blame.png"
)
$code = @'
using System;
using System.Runtime.InteropServices;
public class Win32 {
  [DllImport("user32.dll", SetLastError=true)] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
  public struct RECT { public int Left, Top, Right, Bottom; }
}
'@
Add-Type -TypeDefinition $code -Language CSharp
Add-Type -AssemblyName System.Drawing

$proc = Get-Process -Id $TargetPid -ErrorAction SilentlyContinue
if (-not $proc) { Write-Output "proc not found"; exit 1 }
$hwnd = $proc.MainWindowHandle
Write-Output "HWND=$hwnd Title=$($proc.MainWindowTitle)"

# Foreground
[Win32]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 500

$rect = New-Object Win32+RECT
[Win32]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
$w = $rect.Right - $rect.Left
$h = $rect.Bottom - $rect.Top
Write-Output "Rect L=$($rect.Left) T=$($rect.Top) W=$w H=$h"

# Target 1366x768 canvas, place window at 0,0
$targetW = 1366
$targetH = 768
$offsetX = 0
$offsetY = 0

# Capture screen region at window rect
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bmp.Size)
$g.Dispose()

# Canvas 1366x768 with dark background, draw window centered
$canvas = New-Object System.Drawing.Bitmap($targetW, $targetH)
$cg = [System.Drawing.Graphics]::FromImage($canvas)
$cg.Clear([System.Drawing.Color]::FromArgb(30,30,30))
# Center: scale down if needed to fit, else center
$scaleX = $targetW / $w
$scaleY = $targetH / $h
$scale = [Math]::Min($scaleX, $scaleY)
$scale = [Math]::Min($scale, 1.0)
$dw = [int]($w * $scale)
$dh = [int]($h * $scale)
$dx = [int](($targetW - $dw) / 2)
$dy = [int](($targetH - $dh) / 2)
$cg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$cg.DrawImage($bmp, $dx, $dy, $dw, $dh)
$cg.Dispose()

$bmp.Dispose()
$canvas.Save($OutFile, [System.Drawing.Imaging.ImageFormat]::Png)
$canvas.Dispose()
Write-Output "Saved: $OutFile ($targetW x $targetH), window ${w}x${h}, placed at ($dx,$dy) scale=$scale"
