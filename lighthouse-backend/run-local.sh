#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    exit 1
fi

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    BUILD_ARGS="--build-arg TARGETARCH=arm64"
else
    BUILD_ARGS="--build-arg TARGETARCH=amd64"
fi

# Build the Docker image
docker build -t faros-backend:local $BUILD_ARGS .

# Run the container with environment variables
docker run -it --rm \
  -p 8080:8080 \
  --env-file .env \
  faros-backend:local 