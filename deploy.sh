#!/bin/bash

# Stop script on any error
set -e

# Fetch the latest code from GitHub
git pull origin main

# Install dependencies
npm install

# Build the app
npm run build

# Restart the PM2 process
pm2 stop paperless
pm2 start paperless

echo "Deployment complete."
