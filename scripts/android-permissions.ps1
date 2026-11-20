$ErrorActionPreference = 'Stop'
$manifestPath = Join-Path $PSScriptRoot '../android/app/src/main/AndroidManifest.xml'
if (-not (Test-Path $manifestPath)) {
    throw 'Android project missing. Run npx cap add android first.'
}
[xml]$manifest = Get-Content -Raw $manifestPath
$androidNs = 'http://schemas.android.com/apk/res/android'
$permissions = @(
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.RECORD_AUDIO',
    'android.permission.CAMERA',
    'android.permission.VIBRATE'
)
foreach ($permission in $permissions) {
    $exists = @($manifest.manifest.'uses-permission') | Where-Object {
        $_ -and $_.GetAttribute('name', $androidNs) -eq $permission
    }
    if (-not $exists) {
        $node = $manifest.CreateElement('uses-permission')
        $attribute = $manifest.CreateAttribute('android', 'name', $androidNs)
        $attribute.Value = $permission
        [void]$node.Attributes.Append($attribute)
        [void]$manifest.manifest.AppendChild($node)
    }
}
$manifest.Save([System.IO.Path]::GetFullPath($manifestPath))
Write-Host 'Martigo foreground location, microphone, camera and network permissions configured.'