#!/bin/sh
set -e

# Default values
export API_URL="${API_URL:-http://localhost:3000}"
export SOCKET_URL="${SOCKET_URL:-http://localhost:8020}"

echo "==> API_URL:    $API_URL"
echo "==> SOCKET_URL: $SOCKET_URL"

# Generate runtime config for the SPA
cat > /usr/share/nginx/html/runtime-config.json << EOF
{
  "apiUrl": "${API_URL}",
  "socketUrl": "${SOCKET_URL}"
}
EOF

exec nginx -g 'daemon off;'
