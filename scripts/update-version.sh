#!/bin/bash

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 2.0.1"
  exit 1
fi

VERSION="$1"

# Update package.json
sed -i -E 's/"version": "[^"]*"/"version": "'"${VERSION}"'"/' package.json

# Update Cargo.toml - match version under [package] only
sed -i -E '/^\[package\]$/,/^\[/ s/^version = "[^"]*"/version = "'"${VERSION}"'"/' src-tauri/Cargo.toml

# Update tauri.conf.json
sed -i -E 's/"version": "[^"]*"/"version": "'"${VERSION}"'"/' src-tauri/tauri.conf.json

echo "Version updated to ${VERSION} in all files"
