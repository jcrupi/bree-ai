#!/bin/bash
echo "Starting BREE AI Local Docker Ecosystem..."
docker-compose up -d
echo "All services started."
echo "API:            http://localhost:3000"
echo "KAT.ai:         http://localhost:8081"
echo "Genius Talent:  http://localhost:8082"
echo "Habitaware AI:  http://localhost:8083"
echo "The Vineyard:   http://localhost:8084"
echo "AI Tracker:     http://localhost:8085"
