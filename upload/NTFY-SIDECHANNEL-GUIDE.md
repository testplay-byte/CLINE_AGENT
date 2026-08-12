# NTFY Side-Channel Communication Protocol

## What This Is

This document enables real-time communication between an AI agent and a user **during tool execution** — something that is normally impossible in a standard request-response chat loop.

Normally, the flow is:
```
User message → Agent thinks → Agent runs tools → Agent sends final response → User responds
```

With this side-channel, the flow becomes:
```
User message → Agent thinks → Agent runs tools → 
    ↕ (mid-execution, via NTFY)
    Agent asks question → User answers → Agent continues
→ Agent sends final response → User responds
```

The agent can ask the user clarifying questions, get answers, and continue — all within a single execution turn. No need for back-and-forth turns in the main chat.

---

## How It Works

We use [ntfy.sh](https://ntfy.sh) — a free, open-source HTTP-based pub/sub push notification service. No account needed, no installation required.

### Core Concept

1. Agent and user agree on a **topic name** (a unique string)
2. Agent sends messages to that topic via HTTP POST
3. User reads/replies via their browser at `https://ntfy.sh/<topic>`
4. Agent polls the topic via HTTP GET with timestamp-based filtering
5. Communication happens in **rounds**: send → wait → receive → reply → next round

### Why This Works From a Server/Agent Environment

Standard NTFY long-polling (`?poll=1`) does **not** work from most server/cloud environments — the connection is cut immediately by network proxies. We solved this with:

- **Active polling loop**: Short HTTP requests every 3 seconds instead of one long-held connection
- **Timestamp-based filtering**: Using `?since=<unix_timestamp>` instead of `?since=<message_id>` — the message ID approach is unreliable from server environments (the `since` parameter gets ignored by the NTFY API when routed through certain proxies/CDNs)
- **Double time validation**: Even with timestamp filtering, we verify the received message's timestamp is actually newer than our poll start time

---

## Before You Begin: Ask the User

Before setting up anything, ask the user for:

1. **Topic name** — any unique string. Example: `myproject-chat-abc123`. Keep it somewhat random to avoid collisions with other NTFY users. Tell the user they can pick anything memorable.
2. **Poll timeout** — how many seconds to wait for a response each round. Default is **60 seconds**. The user can request longer (e.g., 90s, 120s) or shorter (e.g., 30s). The poll loop formula is: `iterations = timeout_seconds ÷ 3` (each iteration sleeps 3 seconds).

Also guide the user on their setup:

> **User Setup Instructions** (share this with the user):
>
> 1. Open `https://ntfy.sh/<topic>` in a browser tab and keep it open
> 2. You'll see all messages appear in real-time
> 3. To reply, use the text input at the bottom of the page and hit send
> 4. Alternatively, use the NTFY mobile app (iOS/Android/F-Droid) and subscribe to the topic
> 5. Or use curl: `curl -d "your message" ntfy.sh/<topic>`
>
> Keep the page open while the agent is working — the agent will send you questions and wait for your reply.

---

## Setup: The Poll Script

Create this script file in the project directory. It handles one complete round: send a message, poll for a response, return the result.

### File: `ntfy-poll.sh`

```bash
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
  SEND_RESULT=$(curl -s -H "Title: 💬 Agent" -H "Priority: high" -d "$MY_MESSAGE" "ntfy.sh/$TOPIC")
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
```

### No State Files Needed

Unlike earlier iterations that required tracking message IDs and maintaining state files, this script is **completely stateless**. Each round is self-contained:
- It uses the current timestamp to filter messages
- It doesn't need to know about previous rounds
- There are no files to create, update, or clean up

---

## The Round-Based Workflow

### How to Run a Single Round

```bash
cd /home/z/my-project
bash ntfy-poll.sh "<topic>" <timeout> "<your message>"
```

**Example:**
```bash
bash ntfy-poll.sh "myproject-chat-abc" 60 "I found 2 matching results. Which one do you want? 1) Option A  2) Option B"
```

**Expected output (user replied):**
```
TIMESTAMP:1784225266
SENT_ID:B2qhFftYisIg
RESPONSE:1) Option A please
RESPONSE_TIME:1784225299
```

**Expected output (no reply, timed out):**
```
TIMESTAMP:1784225266
SENT_ID:B2qhFftYisIg
TIMEOUT
```

### Multi-Round Conversation: How the Agent MUST Behave

This is the most important section. It describes exactly how the agent must structure its behavior during a multi-round NTFY conversation. Read this carefully and follow the pattern precisely.

#### The Behavioral Pattern

A multi-round conversation is a sequence where the agent chains multiple rounds together. **Each round is ONE tool call** (one `bash ntfy-poll.sh ...` execution). Between every tool call, the agent writes a short status update in the **main chat text**. This is critical — it keeps the user informed in the main chat while the NTFY channel handles the live back-and-forth.

The exact flow for each round is:

1. **Tool call**: Run `ntfy-poll.sh` — this sends your message to NTFY and polls for the user's reply
2. **Tool call returns**: Parse the output — you either got a `RESPONSE:` or `TIMEOUT`
3. **Write text in main chat**: A short, formatted line describing what happened in this round, what the user said (summarized), and what you're doing next
4. **Next tool call**: Start the next round (send a new message + poll again)

**You MUST do all of these steps. Do not skip step 3. The main chat text is not optional — it is the persistent log of the conversation.**

#### Concrete Example: What the Agent's Response Should Look Like

Here is a real example of how the agent's behavior should look during a 4-round conversation. Notice the pattern of: **tool call → text update → tool call → text update → ...**

---

**The agent sends the first message (Round 1):**

```
[Tool Call: bash ntfy-poll.sh "mytopic" 60 "Hey! Let's test the connection. Reply with anything!"]

Output:
TIMESTAMP:1784225266
SENT_ID:B2qhFftYisIg
RESPONSE:Yes I see you 😺
RESPONSE_TIME:1784225299
```

**The agent writes in the main chat (between Round 1 and Round 2):**

> **Got it!** 🎉 You said: *"Yes I see you 😺"*
>
> Replying via NTFY and starting Round 2...

```
[Tool Call: bash ntfy-poll.sh "mytopic" 60 "Got your 😺! Round 1 successful. Now in Round 2 — send me anything else!"]

Output:
TIMESTAMP:1784225319
SENT_ID:bEKAUxVt2FqE
RESPONSE:What is a good dog name 🐕🐶
RESPONSE_TIME:1784225345
```

**The agent writes in the main chat (between Round 2 and Round 3):**

> **Round 2** ✅ You asked: *"What is a good dog name 🐕🐶"*
>
> Replying with suggestions and starting Round 3...

```
[Tool Call: bash ntfy-poll.sh "mytopic" 60 "Good dog names: Max, Luna, Charlie, Bella, Cooper, Daisy, Milo, Lucy. Round 3 — send anything!"]

Output:
TIMESTAMP:1784225373
SENT_ID:ebnLzeoSFrAk
RESPONSE:I think things are going quite promising. You are seeing my messages properly and replying properly too. The next message I want is a random set of emojis.
RESPONSE_TIME:1784225384
```

**The agent writes in the main chat (between Round 3 and Round 4):**

> **Round 3** ✅ You said: *"things are going quite promising... give me a random set of emojis"*
>
> Sending emojis and starting Round 4...

```
[Tool Call: bash ntfy-poll.sh "mytopic" 60 "Here are 10 random emojis: 🎸 🌙 🍕 🚀 🎭 🌊 🎯 🦊 🍰 ⚡ — Round 4, say anything!"]

Output:
TIMESTAMP:1784225392
SENT_ID:nuqpS56JLF3C
RESPONSE:stop
RESPONSE_TIME:1784225400
```

**The agent writes in the main chat (final, after Round 4):**

> **Round 4** ✅ You said *"stop"* — ending the session.
>
> Completed 4 rounds. All successful!

---

#### The Text Format Between Rounds

Between each tool call, the agent MUST write a short update in the main chat using this format:

```
**Round <N>** ✅ You said: *"<brief summary or quote of what user said>"*

<Brief description of what you're doing next, e.g., "Sending dog names and starting Round 3...">
```

**Rules for the inter-round text:**

1. **Always start with the round number** — `**Round 1**`, `**Round 2**`, etc.
2. **Always use ✅** if the round was successful (got a response)
3. **Quote or summarize the user's message** — use italics: `*"user's message here"*`. If it's long, summarize it but keep the key part
4. **Say what you're doing next** — one sentence describing your next action
5. **Keep it brief** — 2-3 lines max. This is a status update, not a full explanation
6. **If a round timed out**, use ⏰ instead of ✅ and say: `**Round <N>** ⏰ No response in 60s. Continuing with...`

**Examples of good inter-round text:**

- `**Round 3** ✅ You asked: *"What is 47 × 36?"* — Replying with the answer and starting Round 4...`
- `**Round 5** ✅ You said: *"give me 50 random emojis"* — Sending emojis and starting Round 6...`
- `**Round 2** ⏰ No response in 60s. Using default layout option and continuing.`
- `**Round 7** ✅ You said: *"Good work, stop"* — Ending session after 7 rounds.`

#### Key Behavioral Rules

1. **One round per tool call** — never combine multiple rounds into a single script or loop. Each tool call = one send + one poll. This keeps things clean, debuggable, and avoids timeouts from the tool execution environment.

2. **Show results in the main chat** — after each tool call returns, write the formatted inter-round text (as described above). The NTFY messages are the live channel; the main chat is the persistent log. **This step is NOT optional.**

3. **Send NTFY notification AND show in chat** — always do both. The user sees the NTFY notification in real-time on their browser/app, and the chat serves as a persistent record.

4. **Auto-continue** — unless the user says to stop, or a round times out, immediately start the next round in the next tool call. Do NOT ask "should I continue?" or "ready for the next round?" between rounds. Just continue.

5. **Stop conditions** — stop the conversation loop when:
   - The user explicitly says "stop", "done", "end", "that's all", "you can stop", etc.
   - A round times out (no response within the timeout period)
   - The tool execution time limit is approaching (leave buffer time — don't start a new round if you have less than 90 seconds of execution budget left)

6. **Respond to the user's actual message** — read what the user said via NTFY and give a relevant, contextual reply. Don't send generic "got your message" responses. If they asked a question, answer it. If they asked for something specific (emojis, a story, a calculation), provide it. Your NTFY reply should be as helpful as your normal chat responses.

### Parsing the Output

In your code, parse the script output to determine what happened:

```bash
OUTPUT=$(bash ntfy-poll.sh "$TOPIC" 60 "$MESSAGE")

if echo "$OUTPUT" | grep -q "^RESPONSE:"; then
  USER_MSG=$(echo "$OUTPUT" | grep "^RESPONSE:" | head -1 | sed 's/^RESPONSE://')
  # User replied — process $USER_MSG, then start next round
elif echo "$OUTPUT" | grep -q "^TIMEOUT"; then
  # No response — decide whether to retry, use defaults, or stop
fi
```

---

## Handling Different Scenarios

### Scenario 1: Quick Clarification During a Task

You're in the middle of coding and hit an ambiguous decision.

```
You: [running tools for the task]
You: [need user input — run poll script with the question]
You: [user replies within 60s]
You: [continue the task with the user's preference]
```

### Scenario 2: Extended Conversation Session

The user wants to have a longer back-and-forth.

```
Round 1: Send opener → poll → get response → report in chat → send next round
Round 2: Send reply → poll → get response → report in chat → send next round
...
Round N: User says stop → send goodbye → end
```

### Scenario 3: Timeout — No User Response

If the user doesn't respond within the timeout:

1. **Don't just keep retrying indefinitely** — this wastes execution time
2. **Report the timeout in the main chat** — "No response in 60s. Continuing with default: X"
3. **Use a sensible default** — make your best judgment and keep going
4. **The user can always correct you** in the next main chat turn

### Scenario 4: Multiple Choice Questions

Structure your NTFY message clearly when asking for a choice:

```
"I need your input:
1) Dark theme with purple accents
2) Light theme with green accents
3) Let me decide

Reply with 1, 2, or 3."
```

---

## Technical Details and Why Things Work This Way

### Why Timestamps Instead of Message IDs

The NTFY API supports `since=<message_id>` to fetch messages after a specific message. However, **this does not work reliably from server/agent environments**. The `since` parameter appears to be ignored or mishandled when requests are routed through certain network infrastructure (proxies, CDNs, or NTFY's own edge servers). The API returns ALL messages on the topic regardless of the `since` ID.

The `since=<unix_timestamp>` parameter (seconds since epoch) **does work reliably**. Combined with double-validation (checking the message's own `time` field), this ensures we only process genuinely new messages.

### Why Active Polling Instead of Long-Polling

NTFY supports `?poll=1` for long-polling (server holds the connection open until a new message arrives). This does NOT work from this server environment — the connection is terminated immediately, returning an empty response. The likely cause is a network proxy or firewall that kills idle HTTP connections.

The active polling approach (short requests every 3 seconds) works because:
- Each request completes quickly (< 1 second)
- No connection is held open long enough to be killed
- The 3-second interval is a good balance between responsiveness and not hammering the API

### Why One Round Per Tool Call

Combining multiple rounds into a single long-running script causes problems:
- Tool execution environments have time limits (typically ~10 minutes)
- Long-running scripts are more likely to hit timeouts or get canceled
- Debugging is harder when things go wrong in the middle of a mega-script
- The agent can't report progress to the chat between rounds

One tool call per round means:
- Clean, predictable execution (~60-90 seconds per call)
- The agent can report results and context between rounds
- If something fails, only one round is lost
- The main chat stays synchronized with what's happening

### What Each NTFY JSON Response Looks Like

When you poll `ntfy.sh/<topic>/json?since=<timestamp>`, you get newline-delimited JSON:

**Stream event (ignore these):**
```json
{"id":"abc123","time":1784225178,"event":"open","topic":"mytopic"}
```

**Actual message (process these):**
```json
{"id":"xyz789","time":1784225200,"expires":1784268400,"event":"message","topic":"mytopic","title":"Optional Title","message":"The actual message body","priority":3}
```

Key fields:
- `event`: Must be `"message"` — skip anything else
- `time`: Unix timestamp — validate this is newer than your `SINCE_TS`
- `message`: The actual text content

---

## Quick Reference

### Send a one-way notification (no reply needed)
```bash
curl -s -H "Title: 📢 Update" -d "Task completed successfully!" ntfy.sh/<topic>
```

### Run one round with reply
```bash
bash ntfy-poll.sh "<topic>" 60 "Your question here"
```

### User setup
1. Open `https://ntfy.sh/<topic>` in browser
2. Keep the tab open
3. Reply using the input at the bottom of the page

### Timeout behavior
- After timeout, the script prints `TIMEOUT` and exits
- The agent should use defaults or ask in the main chat

### Key numbers
- **Poll interval**: 3 seconds between checks
- **Default timeout**: 60 seconds (20 iterations)
- **Max iterations formula**: `(timeout_seconds + 2) / 3`
- **curl timeout per request**: 5 seconds (`--max-time 5`)