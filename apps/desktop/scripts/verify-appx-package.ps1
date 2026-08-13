[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$PackagePath
)

$ErrorActionPreference = 'Stop'

$expectedIdentityName = '42548abeldutra.PixelCore'
$expectedPublisher = 'CN=2E06CDBC-D3D8-4686-8A98-B5E634031252'
$expectedPublisherDisplayName = 'Abel Dutra UI'
$expectedAssets = [ordered]@{
  'StoreLogo.png' = @(50, 50)
  'Square44x44Logo.png' = @(44, 44)
  'Square150x150Logo.png' = @(150, 150)
  'Wide310x150Logo.png' = @(310, 150)
}

function Get-PngDimensions([string]$Path) {
  [byte[]]$header = [System.IO.File]::ReadAllBytes($Path)
  $pngSignature = @(137, 80, 78, 71, 13, 10, 26, 10)

  if ($header.Length -lt 24 -or (@($header[0..7]) -join ',') -ne ($pngSignature -join ',')) {
    throw "Expected a PNG file: $Path"
  }

  $width = (([int]$header[16]) -shl 24) -bor (([int]$header[17]) -shl 16) -bor (([int]$header[18]) -shl 8) -bor [int]$header[19]
  $height = (([int]$header[20]) -shl 24) -bor (([int]$header[21]) -shl 16) -bor (([int]$header[22]) -shl 8) -bor [int]$header[23]
  return @($width, $height)
}

if (-not (Test-Path $PackagePath)) {
  throw "Microsoft Store package is missing: $PackagePath"
}

$package = (Resolve-Path $PackagePath).Path
if ((Get-Item $package).Length -lt 10MB) {
  throw 'Microsoft Store package is unexpectedly small.'
}

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$assetSourceDirectory = Join-Path $repositoryRoot 'apps/desktop/build/appx'
$extractionDirectory = Join-Path ([System.IO.Path]::GetTempPath()) "pixelcore-appx-$([guid]::NewGuid())"

try {
  New-Item -ItemType Directory -Path $extractionDirectory | Out-Null
  & tar -xf $package -C $extractionDirectory
  if ($LASTEXITCODE -ne 0) {
    throw 'Unable to extract the Microsoft Store package.'
  }

  $manifestPath = Join-Path $extractionDirectory 'AppxManifest.xml'
  [xml]$manifest = Get-Content $manifestPath -Raw
  if ($manifest.Package.Identity.Name -ne $expectedIdentityName) { throw 'Store identity name does not match Partner Center.' }
  if ($manifest.Package.Identity.Publisher -ne $expectedPublisher) { throw 'Store publisher does not match Partner Center.' }
  if ($manifest.Package.Identity.ProcessorArchitecture -ne 'x64') { throw 'Store package is not x64.' }
  if ($manifest.Package.Properties.PublisherDisplayName -ne $expectedPublisherDisplayName) { throw 'Publisher display name does not match Partner Center.' }

  $manifestContent = Get-Content $manifestPath -Raw
  foreach ($assetName in $expectedAssets.Keys) {
    $sourceAsset = Join-Path $assetSourceDirectory $assetName
    $packagedAsset = Join-Path $extractionDirectory "assets/$assetName"
    if (-not (Test-Path $sourceAsset)) { throw "Branded AppX source asset is missing: $sourceAsset" }
    if (-not (Test-Path $packagedAsset)) { throw "Branded AppX package asset is missing: $assetName" }
    if (-not $manifestContent.Contains("assets\$assetName")) { throw "AppX manifest does not reference branded asset: $assetName" }

    $expectedSize = $expectedAssets[$assetName]
    $sourceSize = Get-PngDimensions $sourceAsset
    $packagedSize = Get-PngDimensions $packagedAsset
    if ($sourceSize[0] -ne $expectedSize[0] -or $sourceSize[1] -ne $expectedSize[1]) { throw "Source asset has incorrect dimensions: $assetName" }
    if ($packagedSize[0] -ne $expectedSize[0] -or $packagedSize[1] -ne $expectedSize[1]) { throw "Packaged asset has incorrect dimensions: $assetName" }
    if ((Get-FileHash $sourceAsset -Algorithm SHA256).Hash -ne (Get-FileHash $packagedAsset -Algorithm SHA256).Hash) { throw "Packaged asset does not match branded source: $assetName" }
  }

  $archiveEntries = & tar -tf $package
  if ($archiveEntries | Select-String -Quiet 'SampleAppx') { throw 'Microsoft Store package contains an Electron Builder sample tile asset.' }
  if (-not ($archiveEntries | Select-String -Quiet 'resources[\\/]app\.asar$')) { throw 'Packaged application is missing.' }
  if (-not ($archiveEntries | Select-String -Quiet '\.wasm$')) { throw 'SameBoy WASM runtime is missing.' }
}
finally {
  if (Test-Path $extractionDirectory) {
    Remove-Item -Recurse -Force $extractionDirectory
  }
}
