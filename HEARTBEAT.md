# HEARTBEAT.md

## 🚨 MEMORY ENFORCEMENT CHECK — Run Every Heartbeat

```
1. Get today's date: YYYY-MM-DD
2. If memory/YYYY-MM-DD.md does NOT exist:
   a. Create memory/YYYY-MM-DD.md NOW with session template (see below)
   b. Include whatever context is available from SESSION-STATES files
3. If memory/YYYY-MM-DD.md EXISTS:
   a. Check if it has meaningful content (not just a template header)
   b. If it appears to be only a template, add real session content immediately
4. CRITICAL: If any subagents ran today, their SESSION-STATE files in
   strateon/csuite/{ROLE}/SESSION-STATES/ MUST be summarized in today's memory
5. If a subagent session is still running: do NOT write memory yet — wait for it to complete first
```

## Session Recovery Priority

If memory for today doesn't exist AND subagent SESSION-STATES exist from today:
1. Read all SESSION-STATES from `strateon/csuite/*/SESSION-STATES/` dated today
2. Read `strateon/ai-architect/SESSION-STATES/` for today's AI Architect state
3. Write a comprehensive memory/YYYY-MM-DD.md from those sources
4. This is how we recover from sessions that wrote SESSION-STATES but not memory

## Session Template for New Memory Files

```markdown
# YYYY-MM-DD — Daily Memory

## Session Overview
[Who was working, what projects were active]

## Subagent/SESSION-STATE Summary
[For each role that ran today — what they did, what they created, decisions made]

## Files Created or Modified
[Full list of files created or changed today]

## Decisions Made
[Any decisions made during this session]

## Blockers / Open Threads
[What needs to be done next]

## Notes for Next Session
[Any context the next session needs to know]
```

---

## Regular Heartbeat Checks (rotate through)

- **Email** — Any urgent unread messages?
- **Calendar** — Upcoming events in next 24-48h?
- **Git status** — Any uncommitted changes on active projects?
- **OpenClaw status** — Gateway healthy? Any failed jobs?
- **Memory check** — Is today's memory/YYYY-MM-DD.md written? If not → write it NOW

Track last checks in `memory/heartbeat-state.json`.
