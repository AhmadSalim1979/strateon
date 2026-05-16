
---

## Token Accountability Log

### 2026-05-16 — GitHub Token Re-Stored

| Field | Value |
|---|---|
| File | `secrets/github-deploy-token.json` |
| Event | CREATED (token was missing — root cause unknown) |
| Stored by | Moosa (this session) |
| Token prefix | `ghp_ZYzorz` |
| Stored at | 13:45 UTC |
| Reason | Token was absent from secrets/ directory. Push could not complete. Ahmad provided fresh token. |

### Accountability Rules (Effective 2026-05-16)

1. **Never delete tokens from `secrets/` directory** — delete = log immediately
2. **Token access is logged** — every `exec` or `read` of a token file is noted in this log
3. **Token creation is logged** — every new token stored is noted
4. **Token rotation is logged** — every replacement is noted with reason
5. **No token file should ever be untracked in git** — all tokens must remain in `.gitignore` and outside version control

### Audit Trigger

If any token is found missing from `secrets/` AND no corresponding entry exists in this log:
→ **Alert Ahmad immediately with timestamp and last-seen state**

