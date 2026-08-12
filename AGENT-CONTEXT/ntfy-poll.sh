#!/bin/bash
# One clean round: send message → poll for response
# Uses Unix timestamps (NOT message IDs) for reliable filtering
#
# Usage: bash ntfy-poll.sh "<topic>" <timeout_seconds> "<message to send>"
#
# Output lines:
#   TIMESTAMP:<unix_ts>     — when the round started
#   SENT_ID:<id>            — ID of the sent message
#   RESPONSE:<msg>          — user's reply (script exits with 0)
#   RESPONSE_TIME:<unix_ts> — timestamp of the user's message
#   TIMEOUT                 — no response received (script exits with 0)
#
# Exit code is always 0. Check the output to determine what happened.

TOPIC="$1"
TIMEOUT_SECONDS="${2:-60}"
MY_MESSAGE="$3"
ITERATIONS=$(( (TIMEOUT_SECONDS + 2) / 3 ))  # ceiling division, 3s per iteration

# ── Phase 1: Record timestamp and send message ──
BEFORE_TS=$(date +%s)
echo "TIMESTAMP:$BEFORE_TS"

if [ -n "$MY_MESSAGE" ]; then
  SEND_RESULT=$(curl -s -H "Title: \U0001f4ac Agent" -H "Priority: high" -d "$MY_MESSAGE" "ntfy.sh/$TOPIC")
  SENT_ID=$(echo "$SEND_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
  echo "SENT_ID:$SENT_ID"
fi

# Use timestamp AFTER sending — ensures we only see truly new messages
SINCE_TS=$(date +%s)

# ── Phase 2: Poll loop ──
START_TIME=$(date +%s)
for i in $(seq 1 $ITERATIONS); do
  NOW=$(date +%s)
  ELAPSED=$((NOW - START_TIME))
  if [ "$ELAPSED" -ge "$TIMEOUT_SECONDS" ]; then
    break
  fi

  RESPONSE=$(curl -s --max-time 5 "ntfy.sh/$TOPIC/json?since=$SINCE_TS" 2>&1)

  while IFS= read -r line; do
    [ -z "$line" ] && continue

    EVENT=$(echo "$line" | python3 -c "import sys,json; print(json.load(sys.stdin).get('event',''))" 2>/dev/null)

    # Only process actual messages (skip "open", "keepalive" events)
    [ "$EVENT" != "message" ] && continue

    MSG=$(echo "$line" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null)
    MSG_TIME=$(echo "$line" | python3 -c "import sys,json; print(json.load(sys.stdin).get('time',''))" 2>/dev/null)

    # Validate: message must be NEWER than our poll start time
    if [ -n "$MSG_TIME" ] && [ "$MSG_TIME" -gt "$SINCE_TS" ] 2>/dev/null; then
      echo "RESPONSE:$MSG"
      echo "RESPONSE_TIME:$MSG_TIME"
      exit 0
    fi
  done <<< "$RESPONSE"

  sleep 3
done

echo "TIMEOUT"