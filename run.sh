#!/bin/bash

# Start Flask backend in background
python3 app.py &

# Save backend PID
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Open browser
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:8090/index.html
elif command -v open > /dev/null; then
    open http://localhost:8090/index.html
fi

# Start frontend server
python3 -m http.server 8090

# When frontend server stops, kill backend
kill $BACKEND_PID