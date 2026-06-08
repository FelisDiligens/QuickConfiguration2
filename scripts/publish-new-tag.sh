#!/bin/bash

set -euo pipefail

TARGET_BRANCH="main"

# Check for -y flag to skip confirmation
SKIP_CONFIRMATION=false
if [[ ${1:-} == "-y" ]]; then
    SKIP_CONFIRMATION=true
fi

# Get version from package.json
VERSION="$(grep '"version":' package.json | cut -d'"' -f4)"

if [[ -z "$VERSION" ]]; then
    echo "Error: Couldn't get version from package.json"
    exit 1
fi

# Tag name must start with a `v`
if [[ "$VERSION" != v* ]]; then
    TAG_NAME="v${VERSION}"
else
    TAG_NAME="$VERSION"
fi

# Git branch must be "main"
CURRENT_BRANCH="$(git branch --show-current)"
if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
    echo "Error: Current branch is '${CURRENT_BRANCH}'. Must be on '${TARGET_BRANCH}' branch to create a tag."
    exit 1
fi

# Ensure main and origin/main point to the same commit
LOCAL_HASH="$(git rev-parse @)"
REMOTE_HASH="$(git rev-parse '@{u}')"
if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
    echo "Error: Local '${TARGET_BRANCH}' and 'origin/${TARGET_BRANCH}' are not in sync."
    echo "Local:  ${LOCAL_HASH}"
    echo "Remote: ${REMOTE_HASH}"
    echo "Please pull the latest changes from origin/${TARGET_BRANCH} before creating a tag."
    exit 1
fi

# Create new tag
git tag "${TAG_NAME}"

# Get commit info for display
COMMIT_HASH="$(git rev-parse HEAD)"
COMMIT_MESSAGE="$(git log -1 --pretty=format:'%s')"
COMMIT_DATE="$(git log -1 --pretty=format:'%cd')"

# Confirm with user unless -y flag was passed
if [[ "$SKIP_CONFIRMATION" == false ]]; then
    echo ""
    echo "=== Tag Information ==="
    echo "Tag name:   ${TAG_NAME}"
    echo "Commit:     ${COMMIT_HASH}"
    echo "Message:    ${COMMIT_MESSAGE}"
    echo "Date:       ${COMMIT_DATE}"
    echo ""
    read -rp "Do you want to push tag '${TAG_NAME}'? [y/N] " CONFIRM
    if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
        echo "Aborting..."
        git tag -d "${TAG_NAME}"
        exit 1
    fi
fi

# Push tag
git push origin tag "${TAG_NAME}"

echo "Tag ${TAG_NAME} created and pushed successfully"