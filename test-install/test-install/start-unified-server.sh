#!/bin/bash
echo "Starting BMad Unified Server (MCP + REST API)..."
cd mcp-server
npm install
node unified-server-v2.js
