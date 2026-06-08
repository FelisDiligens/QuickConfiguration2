# Define paths
$exePath = "src-tauri\target\release\f76qc2.exe"
$resourcesPath = "src-tauri\resources"
$zipPath = "src-tauri\target\release\bundle\zip\Fallout 76 Quick Configuration_x64-portable.zip"

# Check if the exe and resources exist
if (-not (Test-Path $exePath)) {
    Write-Error "Executable not found at $exePath"
    exit 1
}
if (-not (Test-Path $resourcesPath)) {
    Write-Error "Resources folder not found at $resourcesPath"
    exit 1
}

# Create a temporary directory to stage the files
$tempDir = [System.IO.Path]::GetTempPath() + [System.Guid]::NewGuid().ToString()
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy the exe and resources to the temp directory
Copy-Item -Path $exePath -Destination $tempDir
Copy-Item -Path $resourcesPath -Destination $tempDir -Recurse

# Create zip parent folder
New-Item -ItemType Directory -Force -Path "$(Split-Path $zipPath -Parent)"

# Create the zip archive
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

# Clean up the temporary directory
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Zip archive created at $zipPath"