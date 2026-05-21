
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

[2026-05-21T06:47:30.150Z] RunPod API key accessed for operation: load — secrets loaded successfully
[2026-05-21T06:47:30.150Z] RunPod API key accessed for operation: load — secrets loaded successfully
[2026-05-21T06:47:30.150Z] RunPod API key accessed for operation: load — secrets loaded successfully
[2026-05-21T06:47:30.150Z] RunPod API key accessed for operation: graphql_GetPodStatus — POST to https://api.runpod.io/graphql
[2026-05-21T06:48:53.276Z] RunPod API key accessed for operation: load — loaded from /home/node/.openclaw/workspace/secrets/runpod.json
[2026-05-21T06:48:53.276Z] RunPod API key accessed for operation: load — loaded from /home/node/.openclaw/workspace/secrets/runpod.json
[2026-05-21T06:48:53.276Z] RunPod API key accessed for operation: load — loaded from /home/node/.openclaw/workspace/secrets/runpod.json
[2026-05-21T06:48:53.276Z] RunPod API key accessed for operation: getPodStatus — GET https://rest.runpod.io/v1/pods/c1as991q8xtphy
[2026-05-21T06:50:18.151Z] RunPod API key accessed for operation: listPods (GET /pods)
[2026-05-21T06:54:27.630Z] RunPod API key accessed for operation: getPodDetails (per-pod status)
[2026-05-21T06:55:41.400Z] RunPod API key accessed for operation: load — loaded from /home/node/.openclaw/workspace/secrets/runpod.json
[2026-05-21T06:55:41.400Z] RunPod API key accessed for operation: load — loaded from /home/node/.openclaw/workspace/secrets/runpod.json
[2026-05-21T06:55:41.400Z] RunPod API key accessed for operation: load — loaded from /home/node/.openclaw/workspace/secrets/runpod.json
[2026-05-21T06:55:41.401Z] RunPod API key accessed for operation: getPodStatus — GET https://rest.runpod.io/v1/pods/c1as991q8xtphy
[2026-05-21T06:55:45.715Z] RunPod API key accessed for operation: load — loaded from /home/node/.openclaw/workspace/secrets/runpod.json
[2026-05-21T06:55:45.716Z] RunPod API key accessed for operation: load — loaded from /home/node/.openclaw/workspace/secrets/runpod.json
[2026-05-21T06:55:45.716Z] RunPod API key accessed for operation: load — loaded from /home/node/.openclaw/workspace/secrets/runpod.json
[2026-05-21T06:55:45.716Z] RunPod API key accessed for operation: getPodStatus — GET https://rest.runpod.io/v1/pods/c1as99lq8xtphy
[2026-05-21T07:45:25.885Z] RunPod GPU health check — secrets loaded
[2026-05-21T07:45:25.886Z] RunPod GPU health check — GET pod status
[2026-05-21T07:45:27.011Z] RunPod GPU health check — GET /api/tags via proxy with valid token
[2026-05-21T07:45:27.084Z] RunPod GPU health check — GET /api/tags model list check
[2026-05-21T07:51:43.750Z] RunPod GPU health check — secrets loaded
[2026-05-21T07:51:44.987Z] RunPod GPU health check — GET pod status
[2026-05-21T07:51:58.993Z] RunPod GPU health check — secrets loaded
[2026-05-21T07:51:59.842Z] RunPod GPU health check — GET pod status
[2026-05-21T08:04:16.120Z] RunPod GPU health check — secrets loaded
[2026-05-21T08:04:17.039Z] RunPod GPU health check — GET pod status
[2026-05-21T08:04:47.922Z] Watchdog — secrets loaded
[2026-05-21T08:04:48.707Z] Watchdog — GET pod status
[2026-05-21T08:04:58.099Z] Watchdog — secrets loaded
[2026-05-21T08:04:58.992Z] Watchdog — GET pod status
[2026-05-21T08:05:31.234Z] Watchdog — secrets loaded
[2026-05-21T08:05:32.148Z] Watchdog — GET pod status
[2026-05-21T08:05:45.476Z] Watchdog — secrets loaded
[2026-05-21T08:05:46.600Z] Watchdog — GET pod status
[2026-05-21T08:05:55.223Z] Watchdog — secrets loaded
[2026-05-21T08:05:55.223Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T08:05:56.107Z] Watchdog — GET pod status
[2026-05-21T08:05:56.699Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T08:05:56.891Z] Watchdog — GET /api/tags model list check
[2026-05-21T08:08:39.069Z] Watchdog — secrets loaded
[2026-05-21T08:08:39.069Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T08:08:39.069Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T08:08:39.070Z] Watchdog — GET /api/tags model list check
[2026-05-21T08:08:42.360Z] Watchdog — secrets loaded
[2026-05-21T08:08:42.360Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T08:08:43.474Z] Watchdog — GET pod status
[2026-05-21T08:08:44.340Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T08:08:44.498Z] Watchdog — GET /api/tags model list check
[2026-05-21T08:11:23.343Z] Watchdog — secrets loaded
[2026-05-21T08:11:23.343Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T08:11:24.291Z] Watchdog — GET pod status
[2026-05-21T08:11:25.044Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T08:11:25.227Z] Watchdog — GET /api/tags model list check
[2026-05-21T08:13:21.388Z] Watchdog — secrets loaded
[2026-05-21T08:13:21.388Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T08:13:22.289Z] Watchdog — GET pod status
[2026-05-21T08:13:23.188Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T08:13:23.360Z] Watchdog — GET /api/tags model list check
[2026-05-21T08:20:01.723Z] Watchdog — secrets loaded
[2026-05-21T08:20:01.723Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T08:20:02.694Z] Watchdog — GET pod status
[2026-05-21T08:20:03.355Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T08:20:03.510Z] Watchdog — GET /api/tags model list check
[2026-05-21T08:30:01.948Z] Watchdog — secrets loaded
[2026-05-21T08:30:01.949Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T08:30:03.490Z] Watchdog — GET pod status
[2026-05-21T08:30:04.403Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T08:30:04.597Z] Watchdog — GET /api/tags model list check
[2026-05-21T08:40:01.822Z] Watchdog — secrets loaded
[2026-05-21T08:40:01.822Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T08:40:02.725Z] Watchdog — GET pod status
[2026-05-21T08:40:03.402Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T08:40:03.564Z] Watchdog — GET /api/tags model list check
[2026-05-21T08:50:01.931Z] Watchdog — secrets loaded
[2026-05-21T08:50:01.931Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T08:50:03.179Z] Watchdog — GET pod status
[2026-05-21T08:50:03.806Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T08:50:04.017Z] Watchdog — GET /api/tags model list check
[2026-05-21T09:00:01.271Z] Watchdog — secrets loaded
[2026-05-21T09:00:01.271Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T09:00:02.244Z] Watchdog — GET pod status
[2026-05-21T09:00:03.206Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T09:00:03.348Z] Watchdog — GET /api/tags model list check
[2026-05-21T09:10:01.813Z] Watchdog — secrets loaded
[2026-05-21T09:10:01.813Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T09:10:02.744Z] Watchdog — GET pod status
[2026-05-21T09:10:03.536Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T09:10:03.672Z] Watchdog — GET /api/tags model list check
[2026-05-21T09:20:01.990Z] Watchdog — secrets loaded
[2026-05-21T09:20:01.990Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T09:20:03.579Z] Watchdog — GET pod status
[2026-05-21T09:20:04.080Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T09:20:04.240Z] Watchdog — GET /api/tags model list check
[2026-05-21T09:30:01.525Z] Watchdog — secrets loaded
[2026-05-21T09:30:01.525Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T09:30:02.502Z] Watchdog — GET pod status
[2026-05-21T09:30:03.522Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T09:30:03.671Z] Watchdog — GET /api/tags model list check
[2026-05-21T09:40:02.039Z] Watchdog — secrets loaded
[2026-05-21T09:40:02.039Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T09:40:08.056Z] Watchdog — GET pod status
[2026-05-21T09:40:09.001Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T09:40:09.160Z] Watchdog — GET /api/tags model list check
[2026-05-21T09:50:01.595Z] Watchdog — secrets loaded
[2026-05-21T09:50:01.595Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T09:50:02.589Z] Watchdog — GET pod status
[2026-05-21T09:50:03.526Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T09:50:03.692Z] Watchdog — GET /api/tags model list check
[2026-05-21T10:00:02.057Z] Watchdog — secrets loaded
[2026-05-21T10:00:02.057Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T10:00:03.973Z] Watchdog — GET pod status
[2026-05-21T10:00:04.606Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T10:00:05.012Z] Watchdog — GET /api/tags model list check
[2026-05-21T10:10:01.299Z] Watchdog — secrets loaded
[2026-05-21T10:10:01.299Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T10:10:02.265Z] Watchdog — GET pod status
[2026-05-21T10:10:03.187Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T10:10:03.384Z] Watchdog — GET /api/tags model list check
[2026-05-21T10:20:01.775Z] Watchdog — secrets loaded
[2026-05-21T10:20:01.776Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T10:20:02.787Z] Watchdog — GET pod status
[2026-05-21T10:20:03.475Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T10:20:03.619Z] Watchdog — GET /api/tags model list check
[2026-05-21T10:20:03.764Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T10:20:13.944Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T10:20:24.190Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T10:20:24.537Z] Watchdog — GET /api/tags model list check
[2026-05-21T10:20:34.683Z] Watchdog — GET /api/tags model list check
[2026-05-21T10:20:45.026Z] Watchdog — GET /api/tags model list check
[2026-05-21T10:30:01.500Z] Watchdog — secrets loaded
[2026-05-21T10:30:01.501Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T10:30:02.546Z] Watchdog — GET pod status
[2026-05-21T10:30:03.468Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T10:30:03.626Z] Watchdog — GET /api/tags model list check
[2026-05-21T10:40:01.076Z] Watchdog — secrets loaded
[2026-05-21T10:40:01.076Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T10:40:02.000Z] Watchdog — GET pod status
[2026-05-21T10:40:02.878Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T10:40:03.039Z] Watchdog — GET /api/tags model list check
[2026-05-21T10:50:01.516Z] Watchdog — secrets loaded
[2026-05-21T10:50:01.516Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T10:50:02.436Z] Watchdog — GET pod status
[2026-05-21T10:50:03.206Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T10:50:03.399Z] Watchdog — GET /api/tags model list check
[2026-05-21T11:00:01.743Z] Watchdog — secrets loaded
[2026-05-21T11:00:01.743Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T11:00:02.730Z] Watchdog — GET pod status
[2026-05-21T11:00:03.503Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T11:00:03.695Z] Watchdog — GET /api/tags model list check
[2026-05-21T11:10:01.996Z] Watchdog — secrets loaded
[2026-05-21T11:10:01.996Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T11:10:03.364Z] Watchdog — GET pod status
[2026-05-21T11:10:04.311Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T11:10:04.889Z] Watchdog — GET /api/tags model list check
[2026-05-21T11:20:01.287Z] Watchdog — secrets loaded
[2026-05-21T11:20:01.288Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T11:20:02.248Z] Watchdog — GET pod status
[2026-05-21T11:20:03.207Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T11:20:03.376Z] Watchdog — GET /api/tags model list check
[2026-05-21T11:30:01.842Z] Watchdog — secrets loaded
[2026-05-21T11:30:01.842Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T11:30:02.818Z] Watchdog — GET pod status
[2026-05-21T11:30:03.765Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T11:30:03.920Z] Watchdog — GET /api/tags model list check
[2026-05-21T11:40:01.223Z] Watchdog — secrets loaded
[2026-05-21T11:40:01.223Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T11:40:02.188Z] Watchdog — GET pod status
[2026-05-21T11:40:03.118Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T11:40:03.288Z] Watchdog — GET /api/tags model list check
