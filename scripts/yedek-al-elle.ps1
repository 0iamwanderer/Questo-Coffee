# Manuel tek-seferlik yedek — riskli operasyondan önce çağır
# Kullanım:
#   powershell -ExecutionPolicy Bypass -File scripts\yedek-al-elle.ps1
#
# yedekler\ klasörüne tarih-saat damgalı zip oluşturur, periodic script'in
# rotasyonundan etkilenmez (manuel yedek adında "elle-" prefix var).

$ErrorActionPreference = 'Stop'
$ProjectId = 'demo-questo'

$Kok = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$YedekKlasor = Join-Path $Kok 'yedekler'
if (-not (Test-Path $YedekKlasor)) {
    New-Item -ItemType Directory -Path $YedekKlasor -Force | Out-Null
}

$tempDir = Join-Path $Kok 'emulator-veri-elle-temp'
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }

Write-Host "Emulator export ediliyor..."
Push-Location $Kok
try {
    & firebase emulators:export $tempDir --project=$ProjectId --force
} finally {
    Pop-Location
}

if (-not (Test-Path $tempDir)) {
    Write-Host "HATA: Export başarısız oldu (emulator çalışıyor mu?)" -ForegroundColor Red
    exit 1
}

$damga = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$zipYolu = Join-Path $YedekKlasor "elle-$damga.zip"
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipYolu -Force
Remove-Item -Recurse -Force $tempDir

Write-Host "Yedek hazır: $zipYolu" -ForegroundColor Green
Write-Host "Boyut: $([math]::Round((Get-Item $zipYolu).Length / 1KB, 1)) KB"
