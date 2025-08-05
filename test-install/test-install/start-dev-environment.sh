#!/bin/bash
echo "Starting BMad Development Environment..."

# Start REST server in background
cd mcp-server
npm install
BMAD_SERVER_MODE=rest node unified-server-v2.js &
REST_PID=$!

# Wait for REST server to start
sleep 3

# Start web UI
cd ../web-ui
npm install
npm run dev &
WEB_PID=$!

echo "REST Server PID: $REST_PID"
echo "Web UI PID: $WEB_PID"
echo "Development environment running. Press Ctrl+C to stop."

# Wait for user interrupt
trap "kill $REST_PID $WEB_PID; exit" INT
wait
