openssl genrsa -out MyLocalCA.key 2048

openssl req -x509 -new -nodes -key MyLocalCA.key -sha256 -days 1825 -out MyLocalCA.pem -subj "/C=ES/ST=Malaga/L=Malaga/O=company/OU=IT/CN=MyLocalCA"

echo "authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
IP.2 = ::1" > localhost.ext

openssl genrsa -out dev.key 2048

openssl req -new -key dev.key -out dev.csr -subj "/CN=localhost"

openssl x509 -req -in dev.csr -CA MyLocalCA.pem -CAkey MyLocalCA.key -CAcreateserial -out dev.crt -days 825 -sha256 -extfile localhost.ext

mkdir ../certs

mv dev.key ../certs

mv dev.crt ../certs
