#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STATE_FILE="$SCRIPT_DIR/../.machine-state"
AUTHORITY_DIR=$SCRIPT_DIR/../authority
CERTS_DIR="$SCRIPT_DIR/../certs"

mkdir -p "$AUTHORITY_DIR"
mkdir -p "$CERTS_DIR"

LOCAL_IP=$(ip route get 1.1.1.1 | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}')

if [[ -z "$LOCAL_IP" ]]; then
    echo "The local IP address could not be determined"
    exit 1
fi

PREVIOUS_IP=""
if [[ -f "$STATE_FILE" ]]; then
    PREVIOUS_IP=$(grep '^LOCAL_IP=' "$STATE_FILE" | cut -d= -f2- || true)
fi

if [[ -f "$CERTS_DIR/dev.crt" && -f "$CERTS_DIR/dev.key" && "$PREVIOUS_IP" == "$LOCAL_IP" ]]; then
    echo "TLS certificates already up to date for $LOCAL_IP"
    exit 0
fi

echo "Generating TLS certificates for $LOCAL_IP"

# Always regenerate the full CA + dev cert chain together.
# Reusing an old MyLocalCA.pem with a new MyLocalCA.key causes:
#   "CA certificate and CA private key do not match"
rm -f "$AUTHORITY_DIR/MyLocalCA.key" \
      "$AUTHORITY_DIR/MyLocalCA.pem" \
      "$AUTHORITY_DIR/MyLocalCA.srl" \
      "$AUTHORITY_DIR/dev.key" \
      "$AUTHORITY_DIR/dev.csr" \
      "$AUTHORITY_DIR/dev.crt"

openssl genrsa -out "$AUTHORITY_DIR/MyLocalCA.key" 2048

openssl req -x509 -new -nodes -key "$AUTHORITY_DIR/MyLocalCA.key" \
  -sha256 -days 1825 -out "$AUTHORITY_DIR/MyLocalCA.pem" \
  -subj "/C=ES/ST=Malaga/L=Malaga/O=company/OU=IT/CN=MyLocalCA"

echo "authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
IP.2 = ::1
IP.3 = $LOCAL_IP" > "$AUTHORITY_DIR/localhost.ext"

openssl genrsa -out "$AUTHORITY_DIR/dev.key" 2048

openssl req -new -key "$AUTHORITY_DIR/dev.key" -out "$AUTHORITY_DIR/dev.csr" \
  -subj "/CN=localhost"

openssl x509 -req -in "$AUTHORITY_DIR/dev.csr" -CA "$AUTHORITY_DIR/MyLocalCA.pem" \
  -CAkey "$AUTHORITY_DIR/MyLocalCA.key" -CAcreateserial -out "$AUTHORITY_DIR/dev.crt" \
  -days 825 -sha256 -extfile "$AUTHORITY_DIR/localhost.ext"

mv "$AUTHORITY_DIR/dev.key" "$CERTS_DIR/dev.key"
mv "$AUTHORITY_DIR/dev.crt" "$CERTS_DIR/dev.crt"

mkdir -p "$(dirname "$STATE_FILE")"
cat > "$STATE_FILE" <<EOF
LOCAL_IP=$LOCAL_IP
CERTS_UPDATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

echo "Certificates ready for localhost, 127.0.0.1 and $LOCAL_IP"
