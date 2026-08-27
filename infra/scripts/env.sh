#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STATE_FILE="$SCRIPT_DIR/../.machine-state"

find . -type f -name ".env.example" | while read -r example_file; do

    env_file="${example_file%.example}"

    if [[ -f "$env_file" ]]; then
        echo "Skipped (already exists): $env_file"
        continue
    fi

    cp "$example_file" "$env_file"

    echo "Created: $env_file"
done

echo "All .env files have been generated from their corresponding .env.example files."
echo

LOCAL_IP=$(ip route get 1.1.1.1 | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}')

if [[ -z "$LOCAL_IP" ]]; then
    echo "The local IP address could not be determined"
    exit 1
fi

PREVIOUS_IP=""
if [[ -f "$STATE_FILE" ]]; then
    PREVIOUS_IP=$(grep '^LOCAL_IP=' "$STATE_FILE" | cut -d= -f2- || true)
fi

if [[ "$PREVIOUS_IP" != "$LOCAL_IP" ]]; then
    echo "Detected IP change: ${PREVIOUS_IP:-unknown} -> $LOCAL_IP"
    echo "Updating .env URLs to match this machine..."
else
    echo "Detected IP: $LOCAL_IP (unchanged)"
fi

find . -type f -name ".env" | while read -r envfile; do
    echo "Updating $envfile"
    
    sed -E -i \
    "s/\b(localhost|127\.0\.0\.1|10\.[0-9.]+|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9.]+|192\.168\.[0-9.]+)\b/$LOCAL_IP/g" \
    "$envfile"

done

mkdir -p "$(dirname "$STATE_FILE")"
{
  echo "LOCAL_IP=$LOCAL_IP"
  echo "ENV_UPDATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
} > "$STATE_FILE"

echo
echo "Access the app at: https://$LOCAL_IP:8443"
echo "If using Spotify OAuth, register this redirect URI in the Developer Dashboard:"
echo "  https://$LOCAL_IP:8443/api/auth/spotify/callback"
