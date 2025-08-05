#!/bin/bash
echo "Starting BMad REST API Server..."
cd mcp-server
npm install
BMAD_SERVER_MODE=rest node unified-server-v2.js
