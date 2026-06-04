#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
AUTHORITY_DIR=$SCRIPT_DIR/../authority
CERTS_DIR="$SCRIPT_DIR/../certs"

mkdir -p "$AUTHORITY_DIR"
mkdir -p "$CERTS_DIR"

openssl genrsa -out "$AUTHORITY_DIR/MyLocalCA.key" 2048

openssl req -x509 -new -nodes -key "$AUTHORITY_DIR/MyLocalCA.key" \
  -sha256 -days 1825 -out "$AUTHORITY_DIR/MyLocalCA.pem" \
  -subj "/C=ES/ST=Malaga/L=Malaga/O=company/OU=IT/CN=MyLocalCA"


LOCAL_IP=$(ip route get 1.1.1.1 | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}')

if [[ -z "$LOCAL_IP" ]]; then
    echo "The local IP address could not be determined"
    exit 1
fi

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
