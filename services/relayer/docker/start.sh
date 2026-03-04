#!/bin/sh
set -e

echo "Starting Tor..."
tor -f /etc/tor/torrc &
TOR_PID=$!

# Wait for Tor to establish circuit
echo "Waiting for Tor to establish circuit..."
sleep 10

# Print .onion hostname
if [ -f /var/lib/tor/hidden_service/hostname ]; then
    echo "=== Tor Hidden Service ==="
    echo "Onion address: $(cat /var/lib/tor/hidden_service/hostname)"
    echo "=========================="
fi

echo "Starting relayer..."
cd /app/services/relayer
node dist/index.js &
RELAYER_PID=$!

# Wait for either process to exit
wait -n $TOR_PID $RELAYER_PID
exit $?