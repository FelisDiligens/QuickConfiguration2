#!/bin/bash

# See: https://v2.tauri.app/plugin/updater/#building

KEY_PATH="${HOME}/.tauri/f76qc2.key"

if ! [ -f "${KEY_PATH}" ]; then
    echo "Private key not found: ${KEY_PATH}"
    exit 1
fi

read -sp "Private key password: " PASSWORD
echo

if [ -z "${PASSWORD}" ]; then
    echo "Warning: Empty password"
fi

export TAURI_SIGNING_PRIVATE_KEY="${KEY_PATH}"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="${PASSWORD}"

unset KEY_PATH
unset PASSWORD

echo "Exported environment variables, spawning new shell: $SHELL"
$SHELL