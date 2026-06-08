# See: https://v2.tauri.app/plugin/updater/#building

$keyPath="$env:UserProfile\.tauri\f76qc2.key"

if (-not (Test-Path $keyPath)) {
    Write-Error "Private key not found: $keyPath"
    exit 1
}

$password = Read-Host

if (-not $password) {
    Write-Host "Warning: Empty password"
}

act `
    --artifact-server-path "$(Get-Location)\artifacts" `
    --input upload-artifacts=true `
    -s TAURI_SIGNING_PRIVATE_KEY="$(Get-Content "$keyPath")" `
    -s TAURI_SIGNING_PRIVATE_KEY_PASSWORD="$password" `
    -P windows-latest=-self-hosted `
    workflow_dispatch

# TODO: Cleanup after running act on Windows?
# $env:UserProfile\setup-pnpm
# $env:UserProfile\.cache\act
# $env:UserProfile\.rustup\tmp