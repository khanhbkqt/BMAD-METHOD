#!/bin/bash
echo "Starting BMad MCP Server..."
cd mcp-server
npm install
BMAD_SERVER_MODE=mcp node unified-server-v2.js
