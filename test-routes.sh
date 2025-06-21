#!/bin/bash
# Start dev server in background
npm run dev > route-test.log 2>&1 &
DEV_PID=$!

# Wait for server to start
sleep 10

# Kill the dev server
kill $DEV_PID 2>/dev/null

# Extract route warnings
echo "Route collision warnings:"
grep -E "route.*defined|collision" route-test.log

# Clean up
rm -f route-test.log