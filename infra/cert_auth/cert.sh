#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CERTS_DIR="$SCRIPT_DIR/../certs"

mkdir -p "$CERTS_DIR"

openssl genrsa -out "$SCRIPT_DIR/MyLocalCA.key" 2048

openssl req -x509 -new -nodes -key "$SCRIPT_DIR/MyLocalCA.key" \
  -sha256 -days 1825 -out "$SCRIPT_DIR/MyLocalCA.pem" \
  -subj "/C=ES/ST=Malaga/L=Malaga/O=company/OU=IT/CN=MyLocalCA"

echo "authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
IP.2 = ::1" > "$SCRIPT_DIR/localhost.ext"

openssl genrsa -out "$SCRIPT_DIR/dev.key" 2048

openssl req -new -key "$SCRIPT_DIR/dev.key" -out "$SCRIPT_DIR/dev.csr" \
  -subj "/CN=localhost"

openssl x509 -req -in "$SCRIPT_DIR/dev.csr" -CA "$SCRIPT_DIR/MyLocalCA.pem" \
  -CAkey "$SCRIPT_DIR/MyLocalCA.key" -CAcreateserial -out "$SCRIPT_DIR/dev.crt" \
  -days 825 -sha256 -extfile "$SCRIPT_DIR/localhost.ext"

mv "$SCRIPT_DIR/dev.key" "$CERTS_DIR/dev.key"
mv "$SCRIPT_DIR/dev.crt" "$CERTS_DIR/dev.crt"
