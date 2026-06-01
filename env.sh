#!/usr/bin/env bash

set -euo pipefail

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

echo "Detected IP: $LOCAL_IP"

find . -type f -name ".env" | while read -r envfile; do
    echo "Updating $envfile"
    
    sed -E -i \
    "s/\b(localhost|127\.0\.0\.1|10\.[0-9.]+|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9.]+|192\.168\.[0-9.]+)\b/$LOCAL_IP/g" \
    "$envfile"

done

echo "Open at https://$LOCAL_IP:8443"
