#!/usr/bin/env bash

set -euo pipefail

LOCAL_IP=$(ip route get 1.1.1.1 | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}')

echo "Open at https://$LOCAL_IP:8443"
