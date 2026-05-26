
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
[2026-05-21T11:50:01.578Z] Watchdog — secrets loaded
[2026-05-21T11:50:01.578Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T11:50:02.567Z] Watchdog — GET pod status
[2026-05-21T11:50:03.497Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T11:50:03.691Z] Watchdog — GET /api/tags model list check
[2026-05-21T12:00:01.988Z] Watchdog — secrets loaded
[2026-05-21T12:00:01.988Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T12:00:03.731Z] Watchdog — GET pod status
[2026-05-21T12:00:04.711Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T12:00:04.884Z] Watchdog — GET /api/tags model list check
[2026-05-21T12:10:01.273Z] Watchdog — secrets loaded
[2026-05-21T12:10:01.273Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T12:10:02.208Z] Watchdog — GET pod status
[2026-05-21T12:10:03.209Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T12:10:03.577Z] Watchdog — GET /api/tags model list check
[2026-05-21T12:20:02.040Z] Watchdog — secrets loaded
[2026-05-21T12:20:02.040Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T12:20:03.340Z] Watchdog — GET pod status
[2026-05-21T12:20:04.279Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T12:20:04.859Z] Watchdog — GET /api/tags model list check
[2026-05-21T12:30:01.194Z] Watchdog — secrets loaded
[2026-05-21T12:30:01.194Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T12:30:02.201Z] Watchdog — GET pod status
[2026-05-21T12:30:03.122Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T12:30:03.282Z] Watchdog — GET /api/tags model list check
[2026-05-21T12:40:01.702Z] Watchdog — secrets loaded
[2026-05-21T12:40:01.702Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T12:40:02.579Z] Watchdog — GET pod status
[2026-05-21T12:40:03.556Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T12:40:03.736Z] Watchdog — GET /api/tags model list check
[2026-05-21T12:50:01.126Z] Watchdog — secrets loaded
[2026-05-21T12:50:01.126Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T12:50:02.389Z] Watchdog — GET pod status
[2026-05-21T12:50:03.324Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T12:50:03.518Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:00:01.921Z] Watchdog — secrets loaded
[2026-05-21T13:00:01.921Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T13:00:04.019Z] Watchdog — GET pod status
[2026-05-21T13:00:05.003Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:00:05.150Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:10:01.531Z] Watchdog — secrets loaded
[2026-05-21T13:10:01.532Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T13:10:02.495Z] Watchdog — GET pod status
[2026-05-21T13:10:03.243Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:10:03.333Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:10:44.737Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:10:54.861Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:11:05.074Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:11:05.434Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:11:15.541Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:11:25.793Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:20:01.165Z] Watchdog — secrets loaded
[2026-05-21T13:20:01.165Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T13:20:02.185Z] Watchdog — GET pod status
[2026-05-21T13:20:02.893Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:20:02.985Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:20:44.219Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:20:54.311Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:21:04.649Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:21:04.743Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:21:14.859Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:21:25.083Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:30:01.385Z] Watchdog — secrets loaded
[2026-05-21T13:30:01.385Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T13:30:02.365Z] Watchdog — GET pod status
[2026-05-21T13:30:03.208Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:30:03.329Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:30:44.911Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:30:55.005Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:31:05.199Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:31:05.397Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:31:15.494Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:31:25.713Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:40:01.149Z] Watchdog — secrets loaded
[2026-05-21T13:40:01.149Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T13:40:02.106Z] Watchdog — GET pod status
[2026-05-21T13:40:02.832Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:40:02.950Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:40:43.980Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:40:54.131Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:41:04.479Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:41:04.698Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:41:14.791Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:41:24.990Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:50:01.430Z] Watchdog — secrets loaded
[2026-05-21T13:50:01.430Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T13:50:02.418Z] Watchdog — GET pod status
[2026-05-21T13:50:03.102Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:50:03.192Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:50:44.445Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:50:54.523Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:51:04.716Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T13:51:04.809Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:51:14.894Z] Watchdog — GET /api/tags model list check
[2026-05-21T13:51:25.227Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:00:01.711Z] Watchdog — secrets loaded
[2026-05-21T14:00:01.711Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T14:00:02.827Z] Watchdog — GET pod status
[2026-05-21T14:00:03.573Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:00:03.666Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:00:44.650Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:00:54.729Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:01:04.938Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:01:05.140Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:01:15.258Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:01:25.455Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:10:01.177Z] Watchdog — secrets loaded
[2026-05-21T14:10:01.177Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T14:10:02.354Z] Watchdog — GET pod status
[2026-05-21T14:10:02.811Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:10:02.895Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:10:44.696Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:10:54.785Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:11:04.986Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:11:05.222Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:11:15.357Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:11:25.583Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:20:02.038Z] Watchdog — secrets loaded
[2026-05-21T14:20:02.038Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T14:20:03.731Z] Watchdog — GET pod status
[2026-05-21T14:20:04.466Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:20:04.585Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:20:45.677Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:20:55.770Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:21:05.867Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:21:06.191Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:21:16.288Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:21:26.716Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:30:02.052Z] Watchdog — secrets loaded
[2026-05-21T14:30:02.052Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T14:30:03.384Z] Watchdog — GET pod status
[2026-05-21T14:30:04.123Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:30:04.226Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:30:45.630Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:30:55.750Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:31:05.952Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:31:06.208Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:31:16.294Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:31:26.514Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:40:01.867Z] Watchdog — secrets loaded
[2026-05-21T14:40:01.867Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T14:40:03.262Z] Watchdog — GET pod status
[2026-05-21T14:40:04.011Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:40:04.098Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:40:45.455Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:40:55.565Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:41:05.774Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:41:06.017Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:41:16.107Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:41:26.309Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:50:01.640Z] Watchdog — secrets loaded
[2026-05-21T14:50:01.640Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T14:50:03.442Z] Watchdog — GET pod status
[2026-05-21T14:50:04.208Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:50:04.301Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:50:45.750Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:50:55.869Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:51:06.069Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T14:51:06.271Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:51:16.391Z] Watchdog — GET /api/tags model list check
[2026-05-21T14:51:26.480Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:00:01.950Z] Watchdog — secrets loaded
[2026-05-21T15:00:01.950Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T15:00:03.255Z] Watchdog — GET pod status
[2026-05-21T15:00:03.957Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:00:04.042Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:00:45.703Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:00:55.837Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:01:06.068Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:01:06.270Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:01:16.368Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:01:26.453Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:10:01.838Z] Watchdog — secrets loaded
[2026-05-21T15:10:01.838Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T15:10:02.734Z] Watchdog — GET pod status
[2026-05-21T15:10:03.256Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:10:03.335Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:10:44.890Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:10:55.009Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:11:05.216Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:11:05.416Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:11:15.512Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:11:25.728Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:20:01.105Z] Watchdog — secrets loaded
[2026-05-21T15:20:01.105Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T15:20:02.236Z] Watchdog — GET pod status
[2026-05-21T15:20:02.721Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:20:02.796Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:20:44.583Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:20:54.678Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:21:04.887Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:21:05.119Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:21:15.238Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:21:25.436Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:30:01.833Z] Watchdog — secrets loaded
[2026-05-21T15:30:01.833Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T15:30:02.846Z] Watchdog — GET pod status
[2026-05-21T15:30:03.553Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:30:03.668Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:30:45.209Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:30:55.309Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:31:05.511Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:31:05.706Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:31:15.831Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:31:25.920Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:40:01.245Z] Watchdog — secrets loaded
[2026-05-21T15:40:01.245Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T15:40:02.326Z] Watchdog — GET pod status
[2026-05-21T15:40:03.028Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:40:03.117Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:40:44.250Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:40:54.349Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:41:04.702Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:41:04.900Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:41:15.063Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:41:25.280Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:50:01.546Z] Watchdog — secrets loaded
[2026-05-21T15:50:01.546Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T15:50:02.613Z] Watchdog — GET pod status
[2026-05-21T15:50:03.393Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:50:03.470Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:50:44.850Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:50:54.943Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:51:05.031Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T15:51:05.232Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:51:15.355Z] Watchdog — GET /api/tags model list check
[2026-05-21T15:51:25.805Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:00:01.228Z] Watchdog — secrets loaded
[2026-05-21T16:00:01.229Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T16:00:02.251Z] Watchdog — GET pod status
[2026-05-21T16:00:02.987Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:00:03.072Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:00:44.198Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:00:54.276Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:01:04.620Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:01:04.816Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:01:14.909Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:01:25.119Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:10:01.582Z] Watchdog — secrets loaded
[2026-05-21T16:10:01.582Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T16:10:02.546Z] Watchdog — GET pod status
[2026-05-21T16:10:03.273Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:10:03.393Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:10:44.920Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:10:55.041Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:11:05.253Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:11:05.450Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:11:15.569Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:11:25.778Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:20:02.036Z] Watchdog — secrets loaded
[2026-05-21T16:20:02.036Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T16:20:04.652Z] Watchdog — GET pod status
[2026-05-21T16:20:05.407Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:20:05.491Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:20:46.916Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:20:57.005Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:21:07.205Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:21:07.546Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:21:17.669Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:21:27.868Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:30:01.178Z] Watchdog — secrets loaded
[2026-05-21T16:30:01.178Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T16:30:02.275Z] Watchdog — GET pod status
[2026-05-21T16:30:03.068Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:30:03.153Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:30:44.523Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:30:54.612Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:31:04.826Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:31:05.037Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:31:15.126Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:31:25.338Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:40:01.734Z] Watchdog — secrets loaded
[2026-05-21T16:40:01.734Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T16:40:02.746Z] Watchdog — GET pod status
[2026-05-21T16:40:03.433Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:40:03.524Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:40:44.974Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:40:55.095Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:41:05.309Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:41:05.630Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:41:15.710Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:41:25.954Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:50:01.115Z] Watchdog — secrets loaded
[2026-05-21T16:50:01.115Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T16:50:02.028Z] Watchdog — GET pod status
[2026-05-21T16:50:02.824Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:50:02.907Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:50:44.169Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:50:54.270Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:51:04.470Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T16:51:04.560Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:51:14.641Z] Watchdog — GET /api/tags model list check
[2026-05-21T16:51:24.993Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:00:01.461Z] Watchdog — secrets loaded
[2026-05-21T17:00:01.461Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T17:00:02.541Z] Watchdog — GET pod status
[2026-05-21T17:00:03.025Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:00:03.106Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:00:44.869Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:00:54.993Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:01:05.196Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:01:05.417Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:01:15.508Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:01:25.719Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:10:01.952Z] Watchdog — secrets loaded
[2026-05-21T17:10:01.952Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T17:10:03.658Z] Watchdog — GET pod status
[2026-05-21T17:10:04.370Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:10:04.488Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:10:45.957Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:10:56.046Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:11:06.200Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:11:06.396Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:11:16.518Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:11:26.852Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:20:01.341Z] Watchdog — secrets loaded
[2026-05-21T17:20:01.341Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T17:20:02.320Z] Watchdog — GET pod status
[2026-05-21T17:20:03.123Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:20:03.257Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:20:44.544Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:20:54.631Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:21:04.984Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:21:05.186Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:21:15.278Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:21:25.500Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:30:01.771Z] Watchdog — secrets loaded
[2026-05-21T17:30:01.771Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T17:30:03.264Z] Watchdog — GET pod status
[2026-05-21T17:30:03.830Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:30:03.926Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:30:45.747Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:30:55.825Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:31:06.038Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:31:06.163Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:31:16.255Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:31:26.472Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:40:01.664Z] Watchdog — secrets loaded
[2026-05-21T17:40:01.664Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T17:40:02.655Z] Watchdog — GET pod status
[2026-05-21T17:40:03.375Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:40:03.471Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:40:44.876Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:40:54.976Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:41:05.181Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:41:05.383Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:41:15.478Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:41:25.686Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:50:02.066Z] Watchdog — secrets loaded
[2026-05-21T17:50:02.066Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T17:50:04.666Z] Watchdog — GET pod status
[2026-05-21T17:50:05.413Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:50:05.504Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:50:46.831Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:50:56.948Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:51:07.308Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T17:51:07.512Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:51:17.599Z] Watchdog — GET /api/tags model list check
[2026-05-21T17:51:27.802Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:00:01.176Z] Watchdog — secrets loaded
[2026-05-21T18:00:01.176Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T18:00:02.448Z] Watchdog — GET pod status
[2026-05-21T18:00:03.229Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:00:03.342Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:00:44.668Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:00:54.766Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:01:04.961Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:01:05.166Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:01:15.292Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:01:25.491Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:10:02.017Z] Watchdog — secrets loaded
[2026-05-21T18:10:02.017Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T18:10:03.279Z] Watchdog — GET pod status
[2026-05-21T18:10:04.000Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:10:04.092Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:10:45.610Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:10:55.734Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:11:05.942Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:11:06.161Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:11:16.295Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:11:26.498Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:20:01.805Z] Watchdog — secrets loaded
[2026-05-21T18:20:01.805Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T18:20:02.732Z] Watchdog — GET pod status
[2026-05-21T18:20:03.455Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:20:03.534Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:20:44.867Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:20:54.951Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:21:05.161Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:21:05.353Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:21:15.479Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:21:25.698Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:30:01.086Z] Watchdog — secrets loaded
[2026-05-21T18:30:01.086Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T18:30:02.179Z] Watchdog — GET pod status
[2026-05-21T18:30:02.951Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:30:03.046Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:30:44.614Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:30:54.711Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:31:04.919Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:31:05.124Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:31:15.243Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:31:25.450Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:40:01.850Z] Watchdog — secrets loaded
[2026-05-21T18:40:01.850Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T18:40:03.191Z] Watchdog — GET pod status
[2026-05-21T18:40:03.950Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:40:04.042Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:40:45.571Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:40:55.665Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:41:05.862Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:41:06.045Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:41:16.138Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:41:26.227Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:50:01.834Z] Watchdog — secrets loaded
[2026-05-21T18:50:01.834Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-21T18:50:03.680Z] Watchdog — GET pod status
[2026-05-21T18:50:04.393Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:50:04.496Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:50:45.795Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:50:55.880Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:51:06.215Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-21T18:51:06.452Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:51:16.539Z] Watchdog — GET /api/tags model list check
[2026-05-21T18:51:26.631Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:00:01.746Z] Watchdog — secrets loaded
[2026-05-22T06:00:01.747Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T06:00:02.682Z] Watchdog — GET pod status
[2026-05-22T06:00:03.460Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:00:03.578Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:00:44.983Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:00:55.082Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:01:05.282Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:01:05.495Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:01:15.583Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:01:25.784Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:10:01.087Z] Watchdog — secrets loaded
[2026-05-22T06:10:01.087Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T06:10:02.098Z] Watchdog — GET pod status
[2026-05-22T06:10:02.805Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:10:02.889Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:10:43.992Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:10:54.118Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:11:04.313Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:11:04.665Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:11:14.764Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:11:24.975Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:20:01.306Z] Watchdog — secrets loaded
[2026-05-22T06:20:01.306Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T06:20:02.559Z] Watchdog — GET pod status
[2026-05-22T06:20:03.312Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:20:03.405Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:20:44.779Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:20:54.866Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:21:04.953Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:21:05.236Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:21:15.365Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:21:25.555Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:30:01.692Z] Watchdog — secrets loaded
[2026-05-22T06:30:01.692Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T06:30:02.670Z] Watchdog — GET pod status
[2026-05-22T06:30:03.405Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:30:03.499Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:30:44.830Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:30:54.917Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:31:05.120Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:31:05.204Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:31:15.280Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:31:25.491Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:40:01.774Z] Watchdog — secrets loaded
[2026-05-22T06:40:01.774Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T06:40:02.753Z] Watchdog — GET pod status
[2026-05-22T06:40:03.495Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:40:03.575Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:40:44.947Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:40:55.038Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:41:05.254Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:41:05.438Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:41:15.533Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:41:25.741Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:50:01.085Z] Watchdog — secrets loaded
[2026-05-22T06:50:01.086Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T06:50:02.057Z] Watchdog — GET pod status
[2026-05-22T06:50:02.797Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:50:02.884Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:50:44.228Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:50:54.319Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:51:04.658Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T06:51:04.745Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:51:14.820Z] Watchdog — GET /api/tags model list check
[2026-05-22T06:51:25.029Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:00:01.403Z] Watchdog — secrets loaded
[2026-05-22T07:00:01.403Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T07:00:02.349Z] Watchdog — GET pod status
[2026-05-22T07:00:03.215Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:00:03.329Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:00:44.495Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:00:54.594Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:01:04.685Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:01:04.888Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:01:14.977Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:01:25.067Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:10:01.521Z] Watchdog — secrets loaded
[2026-05-22T07:10:01.521Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T07:10:02.575Z] Watchdog — GET pod status
[2026-05-22T07:10:03.356Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:10:03.440Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:10:44.946Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:10:55.034Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:11:05.236Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:11:05.427Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:11:15.545Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:11:25.750Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:20:01.071Z] Watchdog — secrets loaded
[2026-05-22T07:20:01.071Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T07:20:02.203Z] Watchdog — GET pod status
[2026-05-22T07:20:02.937Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:20:03.025Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:20:44.543Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:20:54.633Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:21:04.725Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:21:05.934Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:21:16.018Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:21:26.226Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:30:01.532Z] Watchdog — secrets loaded
[2026-05-22T07:30:01.532Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T07:30:02.565Z] Watchdog — GET pod status
[2026-05-22T07:30:03.095Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:30:03.180Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:30:44.772Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:30:54.864Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:31:05.077Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:31:05.167Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:31:15.245Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:31:25.455Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:40:01.766Z] Watchdog — secrets loaded
[2026-05-22T07:40:01.767Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T07:40:03.576Z] Watchdog — GET pod status
[2026-05-22T07:40:16.135Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:40:16.476Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:40:57.530Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:41:07.615Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:41:17.820Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:41:18.137Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:41:28.222Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:41:38.421Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:50:01.700Z] Watchdog — secrets loaded
[2026-05-22T07:50:01.700Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T07:50:02.690Z] Watchdog — GET pod status
[2026-05-22T07:50:03.418Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:50:03.506Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:50:44.744Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:50:54.833Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:51:04.920Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T07:51:05.259Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:51:15.379Z] Watchdog — GET /api/tags model list check
[2026-05-22T07:51:25.582Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:00:02.034Z] Watchdog — secrets loaded
[2026-05-22T08:00:02.034Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T08:00:03.862Z] Watchdog — GET pod status
[2026-05-22T08:00:04.682Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:00:04.803Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:00:46.157Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:00:56.244Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:01:06.449Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:01:06.650Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:01:16.739Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:01:27.089Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:10:01.431Z] Watchdog — secrets loaded
[2026-05-22T08:10:01.431Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T08:10:02.728Z] Watchdog — GET pod status
[2026-05-22T08:10:03.202Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:10:03.286Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:10:44.660Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:10:54.751Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:11:05.099Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:11:05.290Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:11:15.373Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:11:25.590Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:20:01.149Z] Watchdog — secrets loaded
[2026-05-22T08:20:01.149Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T08:20:02.430Z] Watchdog — GET pod status
[2026-05-22T08:20:03.111Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:20:03.234Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:20:44.477Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:20:54.561Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:21:04.760Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:21:04.961Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:21:15.085Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:21:25.289Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:30:01.599Z] Watchdog — secrets loaded
[2026-05-22T08:30:01.599Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T08:30:02.604Z] Watchdog — GET pod status
[2026-05-22T08:30:03.328Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:30:03.445Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:30:44.991Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:30:55.118Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:31:05.323Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:31:05.417Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:31:15.502Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:31:25.706Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:40:01.128Z] Watchdog — secrets loaded
[2026-05-22T08:40:01.128Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T08:40:02.072Z] Watchdog — GET pod status
[2026-05-22T08:40:02.573Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:40:02.672Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:40:43.724Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:40:53.805Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:41:04.012Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:41:04.102Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:41:14.182Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:41:24.398Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:50:01.917Z] Watchdog — secrets loaded
[2026-05-22T08:50:01.917Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T08:50:03.190Z] Watchdog — GET pod status
[2026-05-22T08:50:03.937Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:50:04.035Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:50:44.902Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:50:54.986Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:51:05.196Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T08:51:05.390Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:51:15.484Z] Watchdog — GET /api/tags model list check
[2026-05-22T08:51:25.823Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:00:02.021Z] Watchdog — secrets loaded
[2026-05-22T09:00:02.021Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T09:00:03.772Z] Watchdog — GET pod status
[2026-05-22T09:00:04.506Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:00:04.590Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:00:45.739Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:00:55.863Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:01:06.229Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:01:06.579Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:01:16.668Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:01:26.876Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:10:01.258Z] Watchdog — secrets loaded
[2026-05-22T09:10:01.258Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T09:10:02.202Z] Watchdog — GET pod status
[2026-05-22T09:10:02.955Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:10:03.084Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:10:44.657Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:10:54.790Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:11:05.051Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:11:05.286Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:11:15.413Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:11:25.661Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:20:02.051Z] Watchdog — secrets loaded
[2026-05-22T09:20:02.051Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T09:20:03.576Z] Watchdog — GET pod status
[2026-05-22T09:20:04.302Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:20:04.420Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:20:45.676Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:20:55.779Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:21:05.984Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:21:06.184Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:21:16.308Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:21:26.557Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:30:01.826Z] Watchdog — secrets loaded
[2026-05-22T09:30:01.826Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T09:30:03.778Z] Watchdog — GET pod status
[2026-05-22T09:30:04.519Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:30:04.656Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:30:45.922Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:30:56.026Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:31:06.378Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:31:06.462Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:31:16.541Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:31:26.729Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:40:01.210Z] Watchdog — secrets loaded
[2026-05-22T09:40:01.210Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T09:40:02.111Z] Watchdog — GET pod status
[2026-05-22T09:40:02.667Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:40:02.756Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:40:44.435Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:40:54.521Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:41:04.723Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:41:04.930Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:41:15.065Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:41:25.155Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:50:01.716Z] Watchdog — secrets loaded
[2026-05-22T09:50:01.716Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T09:50:02.693Z] Watchdog — GET pod status
[2026-05-22T09:50:03.412Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:50:03.500Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:50:44.810Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:50:54.905Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:51:05.121Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T09:51:05.210Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:51:15.292Z] Watchdog — GET /api/tags model list check
[2026-05-22T09:51:25.512Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:00:01.987Z] Watchdog — secrets loaded
[2026-05-22T10:00:01.987Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T10:00:04.154Z] Watchdog — GET pod status
[2026-05-22T10:00:04.895Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:00:04.995Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:00:46.282Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:00:56.371Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:01:06.573Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:01:06.802Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:01:16.932Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:01:27.021Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:10:01.355Z] Watchdog — secrets loaded
[2026-05-22T10:10:01.355Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T10:10:02.478Z] Watchdog — GET pod status
[2026-05-22T10:10:03.237Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:10:03.322Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:10:44.823Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:10:54.909Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:11:05.122Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:11:05.317Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:11:15.404Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:11:25.614Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:20:02.008Z] Watchdog — secrets loaded
[2026-05-22T10:20:02.008Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T10:20:03.002Z] Watchdog — GET pod status
[2026-05-22T10:20:03.703Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:20:03.823Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:20:45.019Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:20:55.106Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:21:05.318Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:21:05.517Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:21:15.644Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:21:25.983Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:30:01.252Z] Watchdog — secrets loaded
[2026-05-22T10:30:01.252Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T10:30:02.225Z] Watchdog — GET pod status
[2026-05-22T10:30:02.690Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:30:02.779Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:30:44.076Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:30:54.180Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:31:04.391Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:31:04.485Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:31:14.580Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:31:24.802Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:40:01.228Z] Watchdog — secrets loaded
[2026-05-22T10:40:01.228Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T10:40:02.218Z] Watchdog — GET pod status
[2026-05-22T10:40:02.947Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:40:03.040Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:40:44.511Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:40:54.615Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:41:04.857Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:41:04.948Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:41:15.026Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:41:25.231Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:50:01.532Z] Watchdog — secrets loaded
[2026-05-22T10:50:01.532Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T10:50:02.789Z] Watchdog — GET pod status
[2026-05-22T10:50:03.524Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:50:03.611Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:50:44.898Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:50:55.019Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:51:05.369Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T10:51:05.455Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:51:15.534Z] Watchdog — GET /api/tags model list check
[2026-05-22T10:51:25.873Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:00:01.282Z] Watchdog — secrets loaded
[2026-05-22T11:00:01.282Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T11:00:02.267Z] Watchdog — GET pod status
[2026-05-22T11:00:03.108Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:00:03.199Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:00:44.477Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:00:54.581Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:01:04.773Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:01:05.139Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:01:15.226Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:01:25.434Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:10:01.776Z] Watchdog — secrets loaded
[2026-05-22T11:10:01.776Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T11:10:03.430Z] Watchdog — GET pod status
[2026-05-22T11:10:04.132Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:10:04.253Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:10:45.762Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:10:55.880Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:11:06.001Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:11:06.196Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:11:16.291Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:11:26.505Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:20:01.811Z] Watchdog — secrets loaded
[2026-05-22T11:20:01.811Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T11:20:02.732Z] Watchdog — GET pod status
[2026-05-22T11:20:03.423Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:20:03.513Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:20:44.808Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:20:54.892Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:21:05.088Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:21:05.291Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:21:15.378Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:21:25.574Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:30:01.770Z] Watchdog — secrets loaded
[2026-05-22T11:30:01.770Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T11:30:02.769Z] Watchdog — GET pod status
[2026-05-22T11:30:03.273Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:30:03.357Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:30:44.705Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:30:54.794Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:31:05.146Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:31:05.357Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:31:15.449Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:31:25.663Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:40:01.081Z] Watchdog — secrets loaded
[2026-05-22T11:40:01.081Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T11:40:02.040Z] Watchdog — GET pod status
[2026-05-22T11:40:02.514Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:40:02.603Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:40:44.115Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:40:54.238Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:41:04.449Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:41:04.643Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:41:14.769Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:41:24.964Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:50:01.366Z] Watchdog — secrets loaded
[2026-05-22T11:50:01.366Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T11:50:02.314Z] Watchdog — GET pod status
[2026-05-22T11:50:03.058Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:50:03.144Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:50:44.771Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:50:54.872Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:51:05.069Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T11:51:05.293Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:51:15.381Z] Watchdog — GET /api/tags model list check
[2026-05-22T11:51:25.594Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:00:01.962Z] Watchdog — secrets loaded
[2026-05-22T12:00:01.962Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T12:00:03.248Z] Watchdog — GET pod status
[2026-05-22T12:00:03.977Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:00:04.100Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:00:45.266Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:00:55.367Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:01:05.460Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:01:05.792Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:01:15.909Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:01:25.996Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:10:01.490Z] Watchdog — secrets loaded
[2026-05-22T12:10:01.490Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T12:10:02.461Z] Watchdog — GET pod status
[2026-05-22T12:10:02.945Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:10:03.028Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:10:44.570Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:10:54.701Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:11:04.912Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:11:05.104Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:11:15.192Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:11:25.405Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:20:02.018Z] Watchdog — secrets loaded
[2026-05-22T12:20:02.018Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T12:20:03.445Z] Watchdog — GET pod status
[2026-05-22T12:20:03.925Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:20:04.000Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:20:45.414Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:20:55.538Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:21:05.774Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:21:05.979Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:21:16.111Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:21:26.456Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:30:01.736Z] Watchdog — secrets loaded
[2026-05-22T12:30:01.737Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T12:30:02.554Z] Watchdog — GET pod status
[2026-05-22T12:30:03.285Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:30:03.379Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:30:44.912Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:30:54.999Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:31:05.203Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:31:05.295Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:31:15.377Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:31:25.583Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:40:02.016Z] Watchdog — secrets loaded
[2026-05-22T12:40:02.016Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T12:40:03.435Z] Watchdog — GET pod status
[2026-05-22T12:40:04.179Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:40:04.298Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:40:45.484Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:40:55.606Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:41:05.818Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:41:05.908Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:41:15.991Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:41:26.199Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:50:01.378Z] Watchdog — secrets loaded
[2026-05-22T12:50:01.378Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T12:50:02.311Z] Watchdog — GET pod status
[2026-05-22T12:50:03.063Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:50:03.142Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:50:44.294Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:50:54.397Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:51:04.485Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T12:51:04.699Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:51:14.795Z] Watchdog — GET /api/tags model list check
[2026-05-22T12:51:25.134Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:00:01.454Z] Watchdog — secrets loaded
[2026-05-22T13:00:01.454Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T13:00:02.459Z] Watchdog — GET pod status
[2026-05-22T13:00:02.976Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:00:03.058Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:00:44.838Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:00:54.929Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:01:05.137Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:01:05.222Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:01:15.303Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:01:25.514Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:10:01.957Z] Watchdog — secrets loaded
[2026-05-22T13:10:01.958Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T13:10:08.275Z] Watchdog — GET pod status
[2026-05-22T13:10:09.001Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:10:09.108Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:10:51.311Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:11:01.418Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:11:11.634Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:11:11.900Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:11:22.020Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:11:32.441Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:20:01.961Z] Watchdog — secrets loaded
[2026-05-22T13:20:01.962Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T13:20:03.566Z] Watchdog — GET pod status
[2026-05-22T13:20:04.330Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:20:04.452Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:20:45.598Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:20:55.702Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:21:05.802Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:21:06.140Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:21:16.265Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:21:26.468Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:30:01.886Z] Watchdog — secrets loaded
[2026-05-22T13:30:01.886Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T13:30:02.880Z] Watchdog — GET pod status
[2026-05-22T13:30:03.579Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:30:03.697Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:30:45.145Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:30:55.240Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:31:05.451Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:31:05.540Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:31:15.614Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:31:25.817Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:40:01.191Z] Watchdog — secrets loaded
[2026-05-22T13:40:01.191Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T13:40:02.457Z] Watchdog — GET pod status
[2026-05-22T13:40:03.199Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:40:03.284Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:40:44.782Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:40:54.909Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:41:05.102Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:41:05.311Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:41:15.439Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:41:25.640Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:50:01.146Z] Watchdog — secrets loaded
[2026-05-22T13:50:01.146Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T13:50:02.093Z] Watchdog — GET pod status
[2026-05-22T13:50:02.878Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:50:02.997Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:50:44.273Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:50:54.361Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:51:04.698Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T13:51:04.784Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:51:14.863Z] Watchdog — GET /api/tags model list check
[2026-05-22T13:51:25.076Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:00:01.427Z] Watchdog — secrets loaded
[2026-05-22T14:00:01.427Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T14:00:02.400Z] Watchdog — GET pod status
[2026-05-22T14:00:02.916Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:00:02.991Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:00:44.391Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:00:54.517Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:01:04.608Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:01:04.822Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:01:14.911Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:01:25.104Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:10:01.591Z] Watchdog — secrets loaded
[2026-05-22T14:10:01.591Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T14:10:02.575Z] Watchdog — GET pod status
[2026-05-22T14:10:03.275Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:10:03.395Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:10:44.500Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:10:54.588Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:11:04.927Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:11:05.018Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:11:15.098Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:11:25.294Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:20:01.834Z] Watchdog — secrets loaded
[2026-05-22T14:20:01.834Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T14:20:03.777Z] Watchdog — GET pod status
[2026-05-22T14:20:04.503Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:20:04.588Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:20:46.095Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:20:56.225Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:21:06.461Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:21:06.549Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:21:16.641Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:21:26.836Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:30:01.116Z] Watchdog — secrets loaded
[2026-05-22T14:30:01.116Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T14:30:02.127Z] Watchdog — GET pod status
[2026-05-22T14:30:02.918Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:30:03.013Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:30:44.141Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:30:54.218Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:31:04.431Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:31:04.634Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:31:14.726Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:31:24.818Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:40:01.179Z] Watchdog — secrets loaded
[2026-05-22T14:40:01.180Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T14:40:02.140Z] Watchdog — GET pod status
[2026-05-22T14:40:02.836Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:40:02.927Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:40:44.161Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:40:54.249Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:41:04.593Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:41:04.791Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:41:14.883Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:41:25.095Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:50:01.693Z] Watchdog — secrets loaded
[2026-05-22T14:50:01.693Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T14:50:03.008Z] Watchdog — GET pod status
[2026-05-22T14:50:03.694Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:50:03.782Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:50:44.994Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:50:55.092Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:51:05.445Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T14:51:05.642Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:51:15.729Z] Watchdog — GET /api/tags model list check
[2026-05-22T14:51:25.930Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:00:01.225Z] Watchdog — secrets loaded
[2026-05-22T15:00:01.225Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T15:00:02.322Z] Watchdog — GET pod status
[2026-05-22T15:00:03.052Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:00:03.139Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:00:44.547Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:00:54.675Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:01:04.891Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:01:05.092Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:01:15.213Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:01:25.458Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:10:01.744Z] Watchdog — secrets loaded
[2026-05-22T15:10:01.744Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T15:10:02.666Z] Watchdog — GET pod status
[2026-05-22T15:10:03.176Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:10:03.253Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:10:44.805Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:10:54.932Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:11:05.187Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:11:05.381Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:11:15.509Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:11:25.608Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:20:02.014Z] Watchdog — secrets loaded
[2026-05-22T15:20:02.014Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T15:20:03.233Z] Watchdog — GET pod status
[2026-05-22T15:20:03.960Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:20:04.051Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:20:45.571Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:20:55.661Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:21:05.862Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:21:06.068Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:21:16.196Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:21:26.410Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:30:01.826Z] Watchdog — secrets loaded
[2026-05-22T15:30:01.826Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T15:30:02.768Z] Watchdog — GET pod status
[2026-05-22T15:30:03.492Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:30:03.584Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:30:44.974Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:30:55.056Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:31:05.253Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:31:05.340Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:31:15.419Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:31:25.753Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:40:01.926Z] Watchdog — secrets loaded
[2026-05-22T15:40:01.926Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T15:40:03.556Z] Watchdog — GET pod status
[2026-05-22T15:40:04.304Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:40:04.388Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:40:45.717Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:40:55.815Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:41:06.012Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:41:06.220Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:41:16.346Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:41:26.673Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:50:02.001Z] Watchdog — secrets loaded
[2026-05-22T15:50:02.001Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T15:50:03.238Z] Watchdog — GET pod status
[2026-05-22T15:50:03.937Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:50:04.056Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:50:45.367Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:50:55.492Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:51:05.830Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T15:51:06.065Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:51:16.156Z] Watchdog — GET /api/tags model list check
[2026-05-22T15:51:26.367Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:00:01.570Z] Watchdog — secrets loaded
[2026-05-22T16:00:01.570Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T16:00:02.561Z] Watchdog — GET pod status
[2026-05-22T16:00:03.304Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:00:03.391Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:00:44.766Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:00:54.858Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:01:05.063Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:01:05.293Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:01:15.383Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:01:25.479Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:10:02.010Z] Watchdog — secrets loaded
[2026-05-22T16:10:02.010Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T16:10:03.267Z] Watchdog — GET pod status
[2026-05-22T16:10:03.982Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:10:04.100Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:10:45.496Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:10:55.608Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:11:05.813Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:11:06.015Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:11:16.136Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:11:26.359Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:20:01.631Z] Watchdog — secrets loaded
[2026-05-22T16:20:01.631Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T16:20:02.564Z] Watchdog — GET pod status
[2026-05-22T16:20:03.295Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:20:03.418Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:20:44.753Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:20:54.860Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:21:05.070Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:21:05.272Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:21:15.407Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:21:25.499Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:30:01.891Z] Watchdog — secrets loaded
[2026-05-22T16:30:01.891Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T16:30:03.318Z] Watchdog — GET pod status
[2026-05-22T16:30:04.076Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:30:04.169Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:30:45.810Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:30:55.898Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:31:06.145Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:31:06.347Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:31:16.467Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:31:26.559Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:40:01.980Z] Watchdog — secrets loaded
[2026-05-22T16:40:01.980Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T16:40:03.111Z] Watchdog — GET pod status
[2026-05-22T16:40:03.896Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:40:04.021Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:40:45.391Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:40:55.479Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:41:05.681Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:41:05.773Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:41:15.853Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:41:26.073Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:50:01.272Z] Watchdog — secrets loaded
[2026-05-22T16:50:01.273Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T16:50:02.246Z] Watchdog — GET pod status
[2026-05-22T16:50:02.960Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:50:03.065Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:50:44.443Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:50:54.540Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:51:04.742Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T16:51:04.828Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:51:14.915Z] Watchdog — GET /api/tags model list check
[2026-05-22T16:51:25.116Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:00:01.349Z] Watchdog — secrets loaded
[2026-05-22T17:00:01.349Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T17:00:02.411Z] Watchdog — GET pod status
[2026-05-22T17:00:03.140Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:00:03.219Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:00:44.334Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:00:54.414Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:01:04.642Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:01:04.852Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:01:14.939Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:01:25.273Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:10:01.743Z] Watchdog — secrets loaded
[2026-05-22T17:10:01.743Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T17:10:02.724Z] Watchdog — GET pod status
[2026-05-22T17:10:03.447Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:10:03.535Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:10:45.030Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:10:55.107Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:11:05.310Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:11:05.506Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:11:15.600Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:11:25.697Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:20:02.038Z] Watchdog — secrets loaded
[2026-05-22T17:20:02.039Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T17:20:03.493Z] Watchdog — GET pod status
[2026-05-22T17:20:04.249Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:20:04.338Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:20:45.447Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:20:55.524Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:21:05.882Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:21:06.085Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:21:16.173Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:21:26.263Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:30:01.745Z] Watchdog — secrets loaded
[2026-05-22T17:30:01.745Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T17:30:03.227Z] Watchdog — GET pod status
[2026-05-22T17:30:03.936Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:30:04.023Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:30:45.389Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:30:55.517Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:31:05.595Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:31:05.804Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:31:15.923Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:31:26.128Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:40:01.724Z] Watchdog — secrets loaded
[2026-05-22T17:40:01.724Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T17:40:04.038Z] Watchdog — GET pod status
[2026-05-22T17:40:04.758Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:40:04.891Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:40:47.940Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:40:58.051Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:41:08.288Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:41:08.496Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:41:18.607Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:41:28.830Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:50:01.126Z] Watchdog — secrets loaded
[2026-05-22T17:50:01.126Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T17:50:03.586Z] Watchdog — GET pod status
[2026-05-22T17:50:04.579Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:50:04.673Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:50:45.951Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:50:56.087Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:51:06.197Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T17:51:06.422Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:51:16.566Z] Watchdog — GET /api/tags model list check
[2026-05-22T17:51:26.778Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:00:01.264Z] Watchdog — secrets loaded
[2026-05-22T18:00:01.264Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T18:00:02.988Z] Watchdog — GET pod status
[2026-05-22T18:00:03.979Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:00:04.290Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:00:45.710Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:00:56.113Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:01:06.349Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:01:06.716Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:01:16.849Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:01:27.054Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:10:01.222Z] Watchdog — secrets loaded
[2026-05-22T18:10:01.222Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T18:10:02.174Z] Watchdog — GET pod status
[2026-05-22T18:10:02.913Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:10:03.039Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:10:44.403Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:10:54.510Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:11:04.863Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:11:05.052Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:11:15.146Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:11:25.253Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:20:01.653Z] Watchdog — secrets loaded
[2026-05-22T18:20:01.653Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T18:20:02.650Z] Watchdog — GET pod status
[2026-05-22T18:20:03.168Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:20:03.262Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:20:44.595Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:20:54.673Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:21:04.863Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:21:05.066Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:21:15.185Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:21:25.274Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:30:01.785Z] Watchdog — secrets loaded
[2026-05-22T18:30:01.785Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T18:30:02.762Z] Watchdog — GET pod status
[2026-05-22T18:30:03.295Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:30:03.398Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:30:44.898Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:30:55.020Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:31:05.354Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:31:05.556Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:31:15.684Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:31:25.896Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:40:01.224Z] Watchdog — secrets loaded
[2026-05-22T18:40:01.224Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T18:40:02.421Z] Watchdog — GET pod status
[2026-05-22T18:40:03.197Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:40:03.292Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:40:44.802Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:40:54.892Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:41:05.085Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:41:05.175Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:41:15.253Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:41:25.468Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:50:01.833Z] Watchdog — secrets loaded
[2026-05-22T18:50:01.833Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-22T18:50:02.895Z] Watchdog — GET pod status
[2026-05-22T18:50:03.585Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:50:03.673Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:50:44.781Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:50:54.909Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:51:05.263Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-22T18:51:05.478Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:51:15.592Z] Watchdog — GET /api/tags model list check
[2026-05-22T18:51:25.803Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:00:01.626Z] Watchdog — secrets loaded
[2026-05-23T06:00:01.626Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T06:00:03.159Z] Watchdog — GET pod status
[2026-05-23T06:00:03.915Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:00:04.008Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:00:45.670Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:00:55.767Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:01:05.984Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:01:06.070Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:01:16.147Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:01:26.355Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:10:01.641Z] Watchdog — secrets loaded
[2026-05-23T06:10:01.642Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T06:10:02.751Z] Watchdog — GET pod status
[2026-05-23T06:10:03.219Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:10:03.302Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:10:44.536Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:10:54.665Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:11:04.752Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:11:04.952Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:11:15.039Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:11:25.130Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:20:01.442Z] Watchdog — secrets loaded
[2026-05-23T06:20:01.442Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T06:20:02.655Z] Watchdog — GET pod status
[2026-05-23T06:20:03.391Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:20:03.512Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:20:44.906Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:20:55.030Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:21:05.227Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:21:05.372Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:21:15.458Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:21:25.695Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:30:02.054Z] Watchdog — secrets loaded
[2026-05-23T06:30:02.054Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T06:30:03.405Z] Watchdog — GET pod status
[2026-05-23T06:30:03.919Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:30:03.994Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:30:45.588Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:30:55.715Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:31:05.923Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:31:06.117Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:31:16.213Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:31:26.539Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:40:01.650Z] Watchdog — secrets loaded
[2026-05-23T06:40:01.650Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T06:40:03.402Z] Watchdog — GET pod status
[2026-05-23T06:40:04.147Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:40:04.266Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:40:45.728Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:40:55.815Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:41:06.020Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:41:06.217Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:41:16.306Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:41:26.519Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:50:01.781Z] Watchdog — secrets loaded
[2026-05-23T06:50:01.781Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T06:50:03.490Z] Watchdog — GET pod status
[2026-05-23T06:50:03.940Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:50:04.020Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:50:45.674Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:50:55.779Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:51:05.869Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T06:51:06.208Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:51:16.300Z] Watchdog — GET /api/tags model list check
[2026-05-23T06:51:26.443Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:00:01.755Z] Watchdog — secrets loaded
[2026-05-23T07:00:01.755Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T07:00:04.095Z] Watchdog — GET pod status
[2026-05-23T07:00:04.853Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:00:04.971Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:00:46.363Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:00:56.495Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:01:06.596Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:01:06.805Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:01:16.905Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:01:27.253Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:10:01.597Z] Watchdog — secrets loaded
[2026-05-23T07:10:01.597Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T07:10:02.658Z] Watchdog — GET pod status
[2026-05-23T07:10:03.371Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:10:03.454Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:10:45.064Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:10:55.152Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:11:05.372Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:11:05.558Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:11:15.643Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:11:25.837Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:20:01.922Z] Watchdog — secrets loaded
[2026-05-23T07:20:01.922Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T07:20:02.896Z] Watchdog — GET pod status
[2026-05-23T07:20:03.619Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:20:03.705Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:20:45.094Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:20:55.212Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:21:05.411Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:21:05.615Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:21:15.715Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:21:26.070Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:30:01.414Z] Watchdog — secrets loaded
[2026-05-23T07:30:01.414Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T07:30:02.456Z] Watchdog — GET pod status
[2026-05-23T07:30:03.137Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:30:03.228Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:30:44.211Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:30:54.290Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:31:04.631Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:31:04.834Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:31:14.927Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:31:25.015Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:40:01.290Z] Watchdog — secrets loaded
[2026-05-23T07:40:01.290Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T07:40:02.256Z] Watchdog — GET pod status
[2026-05-23T07:40:03.016Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:40:03.147Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:40:44.290Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:40:54.407Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:41:04.745Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:41:04.955Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:41:15.048Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:41:25.169Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:50:01.611Z] Watchdog — secrets loaded
[2026-05-23T07:50:01.611Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T07:50:02.560Z] Watchdog — GET pod status
[2026-05-23T07:50:03.122Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:50:03.201Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:50:44.446Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:50:54.580Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:51:04.914Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T07:51:05.118Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:51:15.241Z] Watchdog — GET /api/tags model list check
[2026-05-23T07:51:25.457Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:00:01.430Z] Watchdog — secrets loaded
[2026-05-23T08:00:01.430Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T08:00:02.372Z] Watchdog — GET pod status
[2026-05-23T08:00:03.141Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:00:03.266Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:00:44.618Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:00:54.694Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:01:04.846Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:01:04.933Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:01:15.012Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:01:25.229Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:10:01.368Z] Watchdog — secrets loaded
[2026-05-23T08:10:01.368Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T08:10:02.403Z] Watchdog — GET pod status
[2026-05-23T08:10:03.110Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:10:03.235Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:10:44.759Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:10:54.841Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:11:05.032Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:11:05.221Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:11:15.313Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:11:25.532Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:20:01.653Z] Watchdog — secrets loaded
[2026-05-23T08:20:01.653Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T08:20:02.584Z] Watchdog — GET pod status
[2026-05-23T08:20:03.291Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:20:03.406Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:20:44.599Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:20:54.685Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:21:04.890Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:21:04.978Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:21:15.053Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:21:25.260Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:30:02.031Z] Watchdog — secrets loaded
[2026-05-23T08:30:02.031Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T08:30:03.538Z] Watchdog — GET pod status
[2026-05-23T08:30:04.254Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:30:04.345Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:30:45.713Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:30:55.833Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:31:06.061Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:31:06.149Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:31:16.245Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:31:26.438Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:40:01.694Z] Watchdog — secrets loaded
[2026-05-23T08:40:01.694Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T08:40:02.755Z] Watchdog — GET pod status
[2026-05-23T08:40:03.502Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:40:03.587Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:40:44.921Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:40:55.008Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:41:05.100Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:41:05.289Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:41:15.379Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:41:25.587Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:50:01.746Z] Watchdog — secrets loaded
[2026-05-23T08:50:01.746Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T08:50:02.665Z] Watchdog — GET pod status
[2026-05-23T08:50:03.433Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:50:03.548Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:50:44.876Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:50:54.970Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:51:05.337Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T08:51:05.422Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:51:15.503Z] Watchdog — GET /api/tags model list check
[2026-05-23T08:51:25.700Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:00:02.014Z] Watchdog — secrets loaded
[2026-05-23T09:00:02.014Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T09:00:03.409Z] Watchdog — GET pod status
[2026-05-23T09:00:04.121Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:00:04.211Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:00:45.534Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:00:55.624Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:01:05.710Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:01:05.915Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:01:16.032Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:01:26.379Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:10:01.985Z] Watchdog — secrets loaded
[2026-05-23T09:10:01.985Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T09:10:03.454Z] Watchdog — GET pod status
[2026-05-23T09:10:03.939Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:10:04.023Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:10:45.503Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:10:55.624Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:11:05.819Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:11:06.026Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:11:16.150Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:11:26.242Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:20:01.337Z] Watchdog — secrets loaded
[2026-05-23T09:20:01.337Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T09:20:02.544Z] Watchdog — GET pod status
[2026-05-23T09:20:03.306Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:20:03.396Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:20:44.902Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:20:55.025Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:21:05.223Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:21:05.433Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:21:15.519Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:21:25.619Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:30:01.302Z] Watchdog — secrets loaded
[2026-05-23T09:30:01.302Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T09:30:02.266Z] Watchdog — GET pod status
[2026-05-23T09:30:02.719Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:30:02.795Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:30:44.403Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:30:54.489Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:31:04.707Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:31:04.915Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:31:15.033Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:31:25.254Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:40:01.808Z] Watchdog — secrets loaded
[2026-05-23T09:40:01.808Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T09:40:03.503Z] Watchdog — GET pod status
[2026-05-23T09:40:04.216Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:40:04.309Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:40:45.819Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:40:55.941Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:41:06.147Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:41:06.303Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:41:16.422Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:41:26.513Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:50:01.376Z] Watchdog — secrets loaded
[2026-05-23T09:50:01.376Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T09:50:02.410Z] Watchdog — GET pod status
[2026-05-23T09:50:03.127Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:50:03.217Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:50:44.602Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:50:54.731Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:51:04.876Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T09:51:05.070Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:51:15.160Z] Watchdog — GET /api/tags model list check
[2026-05-23T09:51:25.372Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:00:01.504Z] Watchdog — secrets loaded
[2026-05-23T10:00:01.505Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T10:00:02.603Z] Watchdog — GET pod status
[2026-05-23T10:00:03.084Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:00:03.167Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:00:45.006Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:00:55.127Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:01:05.220Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:01:05.572Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:01:15.692Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:01:25.890Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:10:01.495Z] Watchdog — secrets loaded
[2026-05-23T10:10:01.495Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T10:10:02.455Z] Watchdog — GET pod status
[2026-05-23T10:10:03.220Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:10:03.349Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:10:44.981Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:10:55.075Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:11:05.288Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:11:05.619Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:11:15.714Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:11:25.922Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:20:01.108Z] Watchdog — secrets loaded
[2026-05-23T10:20:01.108Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T10:20:02.061Z] Watchdog — GET pod status
[2026-05-23T10:20:02.516Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:20:02.598Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:20:43.854Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:20:53.977Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:21:04.172Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:21:04.411Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:21:14.535Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:21:24.875Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:30:01.322Z] Watchdog — secrets loaded
[2026-05-23T10:30:01.322Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T10:30:02.520Z] Watchdog — GET pod status
[2026-05-23T10:30:03.246Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:30:03.336Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:30:44.665Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:30:54.764Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:31:04.855Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:31:05.058Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:31:15.179Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:31:25.521Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:40:01.148Z] Watchdog — secrets loaded
[2026-05-23T10:40:01.148Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T10:40:02.433Z] Watchdog — GET pod status
[2026-05-23T10:40:03.149Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:40:03.270Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:40:44.552Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:40:54.640Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:41:04.982Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:41:05.184Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:41:15.282Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:41:25.490Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:50:01.560Z] Watchdog — secrets loaded
[2026-05-23T10:50:01.561Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T10:50:02.508Z] Watchdog — GET pod status
[2026-05-23T10:50:03.209Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:50:03.320Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:50:44.755Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:50:54.847Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:51:05.201Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T10:51:05.396Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:51:15.520Z] Watchdog — GET /api/tags model list check
[2026-05-23T10:51:25.737Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:00:01.507Z] Watchdog — secrets loaded
[2026-05-23T11:00:01.507Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T11:00:02.490Z] Watchdog — GET pod status
[2026-05-23T11:00:03.228Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:00:03.361Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:00:44.806Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:00:54.896Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:01:05.234Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:01:05.429Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:01:15.519Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:01:25.746Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:10:01.307Z] Watchdog — secrets loaded
[2026-05-23T11:10:01.308Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T11:10:02.551Z] Watchdog — GET pod status
[2026-05-23T11:10:03.280Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:10:03.365Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:10:44.881Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:10:54.970Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:11:05.073Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:11:05.266Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:11:15.355Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:11:25.463Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:20:01.263Z] Watchdog — secrets loaded
[2026-05-23T11:20:01.263Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T11:20:02.492Z] Watchdog — GET pod status
[2026-05-23T11:20:02.954Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:20:03.071Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:20:44.848Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:20:54.972Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:21:05.059Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:21:05.255Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:21:15.380Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:21:25.588Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:30:01.304Z] Watchdog — secrets loaded
[2026-05-23T11:30:01.305Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T11:30:02.276Z] Watchdog — GET pod status
[2026-05-23T11:30:03.024Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:30:03.147Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:30:44.588Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:30:54.675Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:31:04.878Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:31:05.215Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:31:15.318Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:31:25.521Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:40:01.335Z] Watchdog — secrets loaded
[2026-05-23T11:40:01.335Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T11:40:02.374Z] Watchdog — GET pod status
[2026-05-23T11:40:03.114Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:40:03.242Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:40:44.343Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:40:54.470Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:41:04.571Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:41:04.778Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:41:14.866Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:41:25.201Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:50:01.377Z] Watchdog — secrets loaded
[2026-05-23T11:50:01.377Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T11:50:02.367Z] Watchdog — GET pod status
[2026-05-23T11:50:02.830Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:50:02.927Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:50:44.317Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:50:54.413Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:51:04.762Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T11:51:04.989Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:51:15.108Z] Watchdog — GET /api/tags model list check
[2026-05-23T11:51:25.233Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:00:01.481Z] Watchdog — secrets loaded
[2026-05-23T12:00:01.481Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T12:00:02.691Z] Watchdog — GET pod status
[2026-05-23T12:00:03.457Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:00:03.548Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:00:45.197Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:00:55.287Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:01:05.502Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:01:05.708Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:01:15.796Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:01:26.003Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:10:01.422Z] Watchdog — secrets loaded
[2026-05-23T12:10:01.422Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T12:10:02.380Z] Watchdog — GET pod status
[2026-05-23T12:10:03.167Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:10:03.255Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:10:44.899Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:10:55.001Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:11:05.201Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:11:05.408Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:11:15.526Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:11:25.725Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:20:01.761Z] Watchdog — secrets loaded
[2026-05-23T12:20:01.761Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T12:20:02.728Z] Watchdog — GET pod status
[2026-05-23T12:20:03.497Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:20:03.587Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:20:45.011Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:20:55.099Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:21:05.305Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:21:05.509Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:21:15.630Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:21:25.835Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:30:02.000Z] Watchdog — secrets loaded
[2026-05-23T12:30:02.000Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T12:30:03.053Z] Watchdog — GET pod status
[2026-05-23T12:30:03.789Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:30:03.904Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:30:45.394Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:30:55.481Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:31:05.825Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:31:06.027Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:31:16.153Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:31:26.365Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:40:01.333Z] Watchdog — secrets loaded
[2026-05-23T12:40:01.333Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T12:40:02.322Z] Watchdog — GET pod status
[2026-05-23T12:40:02.794Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:40:02.881Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:40:44.521Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:40:54.613Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:41:04.711Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:41:05.056Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:41:15.147Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:41:25.344Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:50:01.946Z] Watchdog — secrets loaded
[2026-05-23T12:50:01.947Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T12:50:03.612Z] Watchdog — GET pod status
[2026-05-23T12:50:04.091Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:50:04.177Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:50:45.825Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:50:55.937Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:51:06.024Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T12:51:06.245Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:51:16.358Z] Watchdog — GET /api/tags model list check
[2026-05-23T12:51:26.571Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:00:01.342Z] Watchdog — secrets loaded
[2026-05-23T13:00:01.343Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T13:00:02.347Z] Watchdog — GET pod status
[2026-05-23T13:00:03.074Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:00:03.159Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:00:44.566Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:00:54.660Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:01:04.867Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:01:05.222Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:01:15.315Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:01:25.518Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:10:01.250Z] Watchdog — secrets loaded
[2026-05-23T13:10:01.250Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T13:10:02.218Z] Watchdog — GET pod status
[2026-05-23T13:10:02.939Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:10:03.024Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:10:44.441Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:10:54.537Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:11:04.743Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:11:05.085Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:11:15.205Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:11:25.398Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:20:01.804Z] Watchdog — secrets loaded
[2026-05-23T13:20:01.804Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T13:20:02.788Z] Watchdog — GET pod status
[2026-05-23T13:20:03.523Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:20:03.619Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:20:44.902Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:20:54.978Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:21:05.180Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:21:05.383Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:21:15.516Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:21:25.875Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:30:01.377Z] Watchdog — secrets loaded
[2026-05-23T13:30:01.377Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T13:30:02.414Z] Watchdog — GET pod status
[2026-05-23T13:30:03.219Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:30:03.303Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:30:44.651Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:30:54.756Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:31:04.877Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:31:05.104Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:31:15.190Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:31:25.569Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:40:01.257Z] Watchdog — secrets loaded
[2026-05-23T13:40:01.257Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T13:40:02.542Z] Watchdog — GET pod status
[2026-05-23T13:40:02.999Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:40:03.085Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:40:44.731Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:40:54.833Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:41:05.184Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:41:05.403Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:41:15.499Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:41:25.591Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:50:01.801Z] Watchdog — secrets loaded
[2026-05-23T13:50:01.801Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T13:50:03.135Z] Watchdog — GET pod status
[2026-05-23T13:50:03.822Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:50:03.911Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:50:45.253Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:50:55.378Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:51:05.576Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T13:51:05.663Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:51:15.742Z] Watchdog — GET /api/tags model list check
[2026-05-23T13:51:25.956Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:00:01.301Z] Watchdog — secrets loaded
[2026-05-23T14:00:01.301Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T14:00:02.598Z] Watchdog — GET pod status
[2026-05-23T14:00:03.320Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:00:03.424Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:00:45.112Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:00:55.232Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:01:05.439Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:01:05.651Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:01:15.738Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:01:25.942Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:10:01.457Z] Watchdog — secrets loaded
[2026-05-23T14:10:01.457Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T14:10:02.491Z] Watchdog — GET pod status
[2026-05-23T14:10:03.249Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:10:03.332Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:10:44.762Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:10:54.888Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:11:05.090Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:11:05.179Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:11:15.260Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:11:25.469Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:20:01.324Z] Watchdog — secrets loaded
[2026-05-23T14:20:01.324Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T14:20:02.302Z] Watchdog — GET pod status
[2026-05-23T14:20:02.755Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:20:02.836Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:20:44.190Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:20:54.275Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:21:04.481Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:21:04.818Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:21:14.918Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:21:25.128Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:30:01.217Z] Watchdog — secrets loaded
[2026-05-23T14:30:01.217Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T14:30:02.186Z] Watchdog — GET pod status
[2026-05-23T14:30:02.639Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:30:02.718Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:30:44.229Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:30:54.321Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:31:04.516Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:31:04.718Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:31:14.805Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:31:24.909Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:40:01.703Z] Watchdog — secrets loaded
[2026-05-23T14:40:01.703Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T14:40:02.623Z] Watchdog — GET pod status
[2026-05-23T14:40:03.376Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:40:03.506Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:40:44.783Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:40:54.908Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:41:05.121Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:41:05.317Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:41:15.406Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:41:25.745Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:50:01.701Z] Watchdog — secrets loaded
[2026-05-23T14:50:01.701Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T14:50:02.706Z] Watchdog — GET pod status
[2026-05-23T14:50:03.472Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:50:03.560Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:50:45.031Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:50:55.117Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:51:05.323Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T14:51:05.512Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:51:15.599Z] Watchdog — GET /api/tags model list check
[2026-05-23T14:51:25.811Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:00:01.406Z] Watchdog — secrets loaded
[2026-05-23T15:00:01.406Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T15:00:02.368Z] Watchdog — GET pod status
[2026-05-23T15:00:03.126Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:00:03.249Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:00:44.756Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:00:54.843Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:01:05.053Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:01:05.254Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:01:15.375Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:01:25.579Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:10:01.528Z] Watchdog — secrets loaded
[2026-05-23T15:10:01.528Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T15:10:02.524Z] Watchdog — GET pod status
[2026-05-23T15:10:03.286Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:10:03.407Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:10:44.787Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:10:54.877Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:11:05.088Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:11:05.290Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:11:15.384Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:11:25.583Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:20:01.242Z] Watchdog — secrets loaded
[2026-05-23T15:20:01.242Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T15:20:02.233Z] Watchdog — GET pod status
[2026-05-23T15:20:02.995Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:20:03.089Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:20:44.461Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:20:54.580Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:21:04.934Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:21:05.138Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:21:15.230Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:21:25.432Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:30:01.636Z] Watchdog — secrets loaded
[2026-05-23T15:30:01.636Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T15:30:02.459Z] Watchdog — GET pod status
[2026-05-23T15:30:03.253Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:30:03.341Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:30:44.621Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:30:54.697Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:31:05.039Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:31:05.127Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:31:15.205Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:31:25.418Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:40:01.349Z] Watchdog — secrets loaded
[2026-05-23T15:40:01.349Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T15:40:02.289Z] Watchdog — GET pod status
[2026-05-23T15:40:03.028Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:40:03.112Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:40:44.473Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:40:54.550Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:41:04.750Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:41:04.943Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:41:15.031Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:41:25.129Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:50:01.820Z] Watchdog — secrets loaded
[2026-05-23T15:50:01.820Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T15:50:02.778Z] Watchdog — GET pod status
[2026-05-23T15:50:03.565Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:50:03.661Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:50:45.151Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:50:55.273Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:51:05.488Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T15:51:05.701Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:51:15.788Z] Watchdog — GET /api/tags model list check
[2026-05-23T15:51:25.992Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:00:01.685Z] Watchdog — secrets loaded
[2026-05-23T16:00:01.685Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T16:00:02.849Z] Watchdog — GET pod status
[2026-05-23T16:00:03.318Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:00:03.410Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:00:45.008Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:00:55.112Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:01:05.312Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:01:05.528Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:01:15.617Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:01:25.821Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:10:01.495Z] Watchdog — secrets loaded
[2026-05-23T16:10:01.495Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T16:10:02.487Z] Watchdog — GET pod status
[2026-05-23T16:10:03.177Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:10:03.264Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:10:44.965Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:10:55.059Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:11:05.282Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:11:05.477Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:11:15.578Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:11:25.783Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:20:01.562Z] Watchdog — secrets loaded
[2026-05-23T16:20:01.562Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T16:20:02.587Z] Watchdog — GET pod status
[2026-05-23T16:20:03.294Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:20:03.382Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:20:44.594Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:20:54.713Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:21:04.912Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:21:05.237Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:21:15.357Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:21:25.567Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:30:01.163Z] Watchdog — secrets loaded
[2026-05-23T16:30:01.163Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T16:30:02.118Z] Watchdog — GET pod status
[2026-05-23T16:30:02.836Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:30:02.959Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:30:44.573Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:30:54.673Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:31:04.760Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:31:04.958Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:31:15.048Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:31:25.262Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:40:01.793Z] Watchdog — secrets loaded
[2026-05-23T16:40:01.793Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T16:40:02.756Z] Watchdog — GET pod status
[2026-05-23T16:40:03.263Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:40:03.353Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:40:44.858Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:40:54.941Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:41:05.141Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:41:05.232Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:41:15.310Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:41:25.648Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:50:01.752Z] Watchdog — secrets loaded
[2026-05-23T16:50:01.752Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T16:50:02.678Z] Watchdog — GET pod status
[2026-05-23T16:50:03.383Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:50:03.507Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:50:44.944Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:50:55.035Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:51:05.387Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T16:51:05.473Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:51:15.555Z] Watchdog — GET /api/tags model list check
[2026-05-23T16:51:25.762Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:00:01.235Z] Watchdog — secrets loaded
[2026-05-23T17:00:01.235Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T17:00:02.512Z] Watchdog — GET pod status
[2026-05-23T17:00:03.216Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:00:03.305Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:00:44.650Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:00:54.737Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:01:04.951Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:01:05.154Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:01:15.239Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:01:25.335Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:10:01.425Z] Watchdog — secrets loaded
[2026-05-23T17:10:01.426Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T17:10:02.437Z] Watchdog — GET pod status
[2026-05-23T17:10:02.936Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:10:03.016Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:10:44.355Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:10:54.441Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:11:04.660Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:11:04.856Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:11:14.943Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:11:25.290Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:20:01.122Z] Watchdog — secrets loaded
[2026-05-23T17:20:01.122Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T17:20:02.340Z] Watchdog — GET pod status
[2026-05-23T17:20:03.091Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:20:03.178Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:20:44.747Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:20:54.870Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:21:05.068Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:21:05.277Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:21:15.367Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:21:25.574Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:30:01.783Z] Watchdog — secrets loaded
[2026-05-23T17:30:01.783Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T17:30:03.652Z] Watchdog — GET pod status
[2026-05-23T17:30:04.412Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:30:04.491Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:30:46.157Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:30:56.255Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:31:06.471Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:31:06.678Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:31:16.765Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:31:26.974Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:40:01.669Z] Watchdog — secrets loaded
[2026-05-23T17:40:01.669Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T17:40:03.720Z] Watchdog — GET pod status
[2026-05-23T17:40:04.467Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:40:04.554Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:40:45.926Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:40:56.032Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:41:06.120Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:41:06.322Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:41:16.408Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:41:26.618Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:50:01.120Z] Watchdog — secrets loaded
[2026-05-23T17:50:01.120Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T17:50:02.163Z] Watchdog — GET pod status
[2026-05-23T17:50:02.872Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:50:02.989Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:50:43.997Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:50:54.102Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:51:04.200Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T17:51:04.541Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:51:14.632Z] Watchdog — GET /api/tags model list check
[2026-05-23T17:51:24.845Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:00:01.412Z] Watchdog — secrets loaded
[2026-05-23T18:00:01.412Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T18:00:02.450Z] Watchdog — GET pod status
[2026-05-23T18:00:03.183Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:00:03.273Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:00:44.549Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:00:54.672Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:01:04.892Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:01:05.097Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:01:15.222Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:01:25.319Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:10:01.147Z] Watchdog — secrets loaded
[2026-05-23T18:10:01.147Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T18:10:02.427Z] Watchdog — GET pod status
[2026-05-23T18:10:02.908Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:10:02.985Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:10:44.592Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:10:54.718Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:11:04.803Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:11:05.002Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:11:15.100Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:11:25.564Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:20:01.589Z] Watchdog — secrets loaded
[2026-05-23T18:20:01.589Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T18:20:02.906Z] Watchdog — GET pod status
[2026-05-23T18:20:03.652Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:20:03.736Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:20:45.998Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:20:56.077Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:21:06.278Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:21:06.469Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:21:16.563Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:21:26.764Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:30:01.188Z] Watchdog — secrets loaded
[2026-05-23T18:30:01.188Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T18:30:02.203Z] Watchdog — GET pod status
[2026-05-23T18:30:02.962Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:30:03.047Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:30:44.303Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:30:54.399Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:31:04.497Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:31:04.829Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:31:14.913Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:31:25.008Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:40:01.650Z] Watchdog — secrets loaded
[2026-05-23T18:40:01.650Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T18:40:02.619Z] Watchdog — GET pod status
[2026-05-23T18:40:03.375Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:40:03.505Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:40:45.147Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:40:55.237Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:41:05.449Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:41:05.655Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:41:15.786Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:41:25.990Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:50:01.667Z] Watchdog — secrets loaded
[2026-05-23T18:50:01.668Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-23T18:50:02.657Z] Watchdog — GET pod status
[2026-05-23T18:50:03.387Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:50:03.511Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:50:44.825Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:50:54.912Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:51:05.007Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-23T18:51:05.201Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:51:15.283Z] Watchdog — GET /api/tags model list check
[2026-05-23T18:51:25.379Z] Watchdog — GET /api/tags model list check
[2026-05-24T06:00:01.095Z] Watchdog — secrets loaded
[2026-05-24T06:00:01.095Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T06:00:02.070Z] Watchdog — GET pod status
[2026-05-24T06:00:02.718Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T06:00:02.847Z] Watchdog — GET /api/tags model list check
[2026-05-24T06:10:01.663Z] Watchdog — secrets loaded
[2026-05-24T06:10:01.663Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T06:10:02.623Z] Watchdog — GET pod status
[2026-05-24T06:10:03.042Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T06:10:03.161Z] Watchdog — GET /api/tags model list check
[2026-05-24T06:20:01.461Z] Watchdog — secrets loaded
[2026-05-24T06:20:01.461Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T06:20:02.425Z] Watchdog — GET pod status
[2026-05-24T06:20:03.089Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T06:20:03.215Z] Watchdog — GET /api/tags model list check
[2026-05-24T06:30:01.728Z] Watchdog — secrets loaded
[2026-05-24T06:30:01.728Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T06:30:03.299Z] Watchdog — GET pod status
[2026-05-24T06:30:03.645Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T06:30:03.763Z] Watchdog — GET /api/tags model list check
[2026-05-24T06:40:01.835Z] Watchdog — secrets loaded
[2026-05-24T06:40:01.835Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T06:40:03.327Z] Watchdog — GET pod status
[2026-05-24T06:40:03.606Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T06:40:03.722Z] Watchdog — GET /api/tags model list check
[2026-05-24T06:50:01.433Z] Watchdog — secrets loaded
[2026-05-24T06:50:01.433Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T06:50:02.370Z] Watchdog — GET pod status
[2026-05-24T06:50:03.061Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T06:50:03.216Z] Watchdog — GET /api/tags model list check
[2026-05-24T07:00:01.713Z] Watchdog — secrets loaded
[2026-05-24T07:00:01.713Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T07:00:03.078Z] Watchdog — GET pod status
[2026-05-24T07:00:03.800Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T07:00:03.915Z] Watchdog — GET /api/tags model list check
[2026-05-24T07:10:02.065Z] Watchdog — secrets loaded
[2026-05-24T07:10:02.066Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T07:10:03.684Z] Watchdog — GET pod status
[2026-05-24T07:10:04.188Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T07:10:04.334Z] Watchdog — GET /api/tags model list check
[2026-05-24T07:20:01.295Z] Watchdog — secrets loaded
[2026-05-24T07:20:01.295Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T07:20:02.337Z] Watchdog — GET pod status
[2026-05-24T07:20:03.063Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T07:20:03.191Z] Watchdog — GET /api/tags model list check
[2026-05-24T07:30:01.165Z] Watchdog — secrets loaded
[2026-05-24T07:30:01.165Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T07:30:02.131Z] Watchdog — GET pod status
[2026-05-24T07:30:02.802Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T07:30:02.942Z] Watchdog — GET /api/tags model list check
[2026-05-24T07:40:01.208Z] Watchdog — secrets loaded
[2026-05-24T07:40:01.209Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T07:40:02.202Z] Watchdog — GET pod status
[2026-05-24T07:40:02.693Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T07:40:02.833Z] Watchdog — GET /api/tags model list check
[2026-05-24T07:50:01.827Z] Watchdog — secrets loaded
[2026-05-24T07:50:01.827Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T07:50:03.901Z] Watchdog — GET pod status
[2026-05-24T07:50:04.588Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T07:50:04.749Z] Watchdog — GET /api/tags model list check
[2026-05-24T08:00:01.839Z] Watchdog — secrets loaded
[2026-05-24T08:00:01.839Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T08:00:04.054Z] Watchdog — GET pod status
[2026-05-24T08:00:04.768Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T08:00:04.933Z] Watchdog — GET /api/tags model list check
[2026-05-24T08:10:01.997Z] Watchdog — secrets loaded
[2026-05-24T08:10:01.998Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T08:10:04.722Z] Watchdog — GET pod status
[2026-05-24T08:10:05.217Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T08:10:05.334Z] Watchdog — GET /api/tags model list check
[2026-05-24T08:20:01.229Z] Watchdog — secrets loaded
[2026-05-24T08:20:01.229Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T08:20:02.203Z] Watchdog — GET pod status
[2026-05-24T08:20:02.865Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T08:20:03.033Z] Watchdog — GET /api/tags model list check
[2026-05-24T08:30:01.766Z] Watchdog — secrets loaded
[2026-05-24T08:30:01.766Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T08:30:02.694Z] Watchdog — GET pod status
[2026-05-24T08:30:03.377Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T08:30:03.493Z] Watchdog — GET /api/tags model list check
[2026-05-24T08:40:01.338Z] Watchdog — secrets loaded
[2026-05-24T08:40:01.338Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T08:40:02.224Z] Watchdog — GET pod status
[2026-05-24T08:40:02.707Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T08:40:02.823Z] Watchdog — GET /api/tags model list check
[2026-05-24T08:50:01.512Z] Watchdog — secrets loaded
[2026-05-24T08:50:01.513Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T08:50:02.576Z] Watchdog — GET pod status
[2026-05-24T08:50:03.050Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T08:50:03.213Z] Watchdog — GET /api/tags model list check
[2026-05-24T09:00:01.583Z] Watchdog — secrets loaded
[2026-05-24T09:00:01.583Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T09:00:02.584Z] Watchdog — GET pod status
[2026-05-24T09:00:03.133Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T09:00:03.284Z] Watchdog — GET /api/tags model list check
[2026-05-24T09:10:01.200Z] Watchdog — secrets loaded
[2026-05-24T09:10:01.200Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T09:10:02.196Z] Watchdog — GET pod status
[2026-05-24T09:10:02.896Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T09:10:03.027Z] Watchdog — GET /api/tags model list check
[2026-05-24T09:20:01.966Z] Watchdog — secrets loaded
[2026-05-24T09:20:01.966Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T09:20:03.145Z] Watchdog — GET pod status
[2026-05-24T09:20:03.846Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T09:20:03.994Z] Watchdog — GET /api/tags model list check
[2026-05-24T09:30:01.654Z] Watchdog — secrets loaded
[2026-05-24T09:30:01.654Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T09:30:02.651Z] Watchdog — GET pod status
[2026-05-24T09:30:03.183Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T09:30:03.347Z] Watchdog — GET /api/tags model list check
[2026-05-24T09:40:01.588Z] Watchdog — secrets loaded
[2026-05-24T09:40:01.588Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T09:40:02.533Z] Watchdog — GET pod status
[2026-05-24T09:40:03.273Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T09:40:03.386Z] Watchdog — GET /api/tags model list check
[2026-05-24T09:50:01.820Z] Watchdog — secrets loaded
[2026-05-24T09:50:01.820Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T09:50:03.550Z] Watchdog — GET pod status
[2026-05-24T09:50:04.058Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T09:50:04.210Z] Watchdog — GET /api/tags model list check
[2026-05-24T10:00:01.553Z] Watchdog — secrets loaded
[2026-05-24T10:00:01.553Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T10:00:02.511Z] Watchdog — GET pod status
[2026-05-24T10:00:03.221Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T10:00:03.394Z] Watchdog — GET /api/tags model list check
[2026-05-24T10:10:01.887Z] Watchdog — secrets loaded
[2026-05-24T10:10:01.887Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T10:10:04.183Z] Watchdog — GET pod status
[2026-05-24T10:10:04.916Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T10:10:05.042Z] Watchdog — GET /api/tags model list check
[2026-05-24T10:20:01.225Z] Watchdog — secrets loaded
[2026-05-24T10:20:01.225Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T10:20:02.167Z] Watchdog — GET pod status
[2026-05-24T10:20:02.843Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T10:20:02.956Z] Watchdog — GET /api/tags model list check
[2026-05-24T10:30:01.575Z] Watchdog — secrets loaded
[2026-05-24T10:30:01.575Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T10:30:02.580Z] Watchdog — GET pod status
[2026-05-24T10:30:03.297Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T10:30:03.415Z] Watchdog — GET /api/tags model list check
[2026-05-24T10:40:01.511Z] Watchdog — secrets loaded
[2026-05-24T10:40:01.511Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T10:40:02.760Z] Watchdog — GET pod status
[2026-05-24T10:40:03.478Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T10:40:03.591Z] Watchdog — GET /api/tags model list check
[2026-05-24T10:50:01.118Z] Watchdog — secrets loaded
[2026-05-24T10:50:01.118Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T10:50:02.087Z] Watchdog — GET pod status
[2026-05-24T10:50:02.801Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T10:50:02.924Z] Watchdog — GET /api/tags model list check
[2026-05-24T11:00:01.162Z] Watchdog — secrets loaded
[2026-05-24T11:00:01.162Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T11:00:02.162Z] Watchdog — GET pod status
[2026-05-24T11:00:02.890Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T11:00:03.030Z] Watchdog — GET /api/tags model list check
[2026-05-24T11:10:01.947Z] Watchdog — secrets loaded
[2026-05-24T11:10:01.948Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T11:10:03.104Z] Watchdog — GET pod status
[2026-05-24T11:10:03.833Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T11:10:03.953Z] Watchdog — GET /api/tags model list check
[2026-05-24T11:20:02.062Z] Watchdog — secrets loaded
[2026-05-24T11:20:02.062Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T11:20:03.733Z] Watchdog — GET pod status
[2026-05-24T11:20:04.406Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T11:20:04.529Z] Watchdog — GET /api/tags model list check
[2026-05-24T11:30:01.763Z] Watchdog — secrets loaded
[2026-05-24T11:30:01.763Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T11:30:02.759Z] Watchdog — GET pod status
[2026-05-24T11:30:03.426Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T11:30:03.536Z] Watchdog — GET /api/tags model list check
[2026-05-24T11:40:01.658Z] Watchdog — secrets loaded
[2026-05-24T11:40:01.658Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T11:40:03.350Z] Watchdog — GET pod status
[2026-05-24T11:40:04.071Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T11:40:04.228Z] Watchdog — GET /api/tags model list check
[2026-05-24T11:50:01.845Z] Watchdog — secrets loaded
[2026-05-24T11:50:01.845Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T11:50:02.861Z] Watchdog — GET pod status
[2026-05-24T11:50:03.504Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T11:50:03.610Z] Watchdog — GET /api/tags model list check
[2026-05-24T12:00:01.642Z] Watchdog — secrets loaded
[2026-05-24T12:00:01.642Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T12:00:02.647Z] Watchdog — GET pod status
[2026-05-24T12:00:03.372Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T12:00:03.531Z] Watchdog — GET /api/tags model list check
[2026-05-24T12:10:01.237Z] Watchdog — secrets loaded
[2026-05-24T12:10:01.237Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T12:10:02.246Z] Watchdog — GET pod status
[2026-05-24T12:10:02.953Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T12:10:03.108Z] Watchdog — GET /api/tags model list check
[2026-05-24T12:20:01.187Z] Watchdog — secrets loaded
[2026-05-24T12:20:01.187Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T12:20:02.207Z] Watchdog — GET pod status
[2026-05-24T12:20:02.892Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T12:20:03.044Z] Watchdog — GET /api/tags model list check
[2026-05-24T12:30:01.370Z] Watchdog — secrets loaded
[2026-05-24T12:30:01.370Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T12:30:02.530Z] Watchdog — GET pod status
[2026-05-24T12:30:03.230Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T12:30:03.342Z] Watchdog — GET /api/tags model list check
[2026-05-24T12:40:01.628Z] Watchdog — secrets loaded
[2026-05-24T12:40:01.628Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T12:40:02.605Z] Watchdog — GET pod status
[2026-05-24T12:40:03.107Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T12:40:03.241Z] Watchdog — GET /api/tags model list check
[2026-05-24T12:50:01.812Z] Watchdog — secrets loaded
[2026-05-24T12:50:01.812Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T12:50:02.770Z] Watchdog — GET pod status
[2026-05-24T12:50:03.214Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T12:50:03.356Z] Watchdog — GET /api/tags model list check
[2026-05-24T13:00:01.910Z] Watchdog — secrets loaded
[2026-05-24T13:00:01.910Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-24T13:00:03.202Z] Watchdog — GET pod status
[2026-05-24T13:00:03.954Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-24T13:00:04.082Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:00:01.712Z] Watchdog — secrets loaded
[2026-05-26T06:00:01.712Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T06:00:02.597Z] Watchdog — GET pod status
[2026-05-26T06:00:03.267Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:00:03.369Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:00:44.353Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:00:54.441Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:01:04.530Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:01:04.823Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:01:14.943Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:01:25.235Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:10:02.008Z] Watchdog — secrets loaded
[2026-05-26T06:10:02.008Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T06:10:03.206Z] Watchdog — GET pod status
[2026-05-26T06:10:03.467Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:10:03.557Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:10:44.813Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:10:54.903Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:11:05.042Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:11:05.173Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:11:15.290Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:11:25.381Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:20:01.808Z] Watchdog — secrets loaded
[2026-05-26T06:20:01.808Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T06:20:02.781Z] Watchdog — GET pod status
[2026-05-26T06:20:03.169Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:20:03.282Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:20:44.521Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:20:54.607Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:21:04.738Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:21:04.826Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:21:14.907Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:21:25.182Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:30:02.087Z] Watchdog — secrets loaded
[2026-05-26T06:30:02.087Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T06:30:03.893Z] Watchdog — GET pod status
[2026-05-26T06:30:04.294Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:30:04.369Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:30:45.564Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:30:55.663Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:31:05.952Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:31:06.039Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:31:16.119Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:31:26.265Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:40:01.111Z] Watchdog — secrets loaded
[2026-05-26T06:40:01.111Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T06:40:02.070Z] Watchdog — GET pod status
[2026-05-26T06:40:02.643Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:40:02.763Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:40:43.858Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:40:53.944Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:41:04.081Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:41:04.254Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:41:14.338Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:41:24.488Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:50:01.347Z] Watchdog — secrets loaded
[2026-05-26T06:50:01.348Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T06:50:02.272Z] Watchdog — GET pod status
[2026-05-26T06:50:02.894Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:50:02.979Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:50:44.244Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:50:54.349Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:51:04.488Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T06:51:04.574Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:51:14.660Z] Watchdog — GET /api/tags model list check
[2026-05-26T06:51:24.815Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:00:01.993Z] Watchdog — secrets loaded
[2026-05-26T07:00:01.993Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T07:00:03.533Z] Watchdog — GET pod status
[2026-05-26T07:00:03.974Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:00:04.049Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:00:45.401Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:00:55.482Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:01:05.574Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:01:05.722Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:01:15.812Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:01:25.994Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:10:01.637Z] Watchdog — secrets loaded
[2026-05-26T07:10:01.637Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T07:10:02.602Z] Watchdog — GET pod status
[2026-05-26T07:10:03.179Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:10:03.267Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:10:44.160Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:10:54.237Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:11:04.510Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:11:04.642Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:11:14.719Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:11:24.816Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:20:01.562Z] Watchdog — secrets loaded
[2026-05-26T07:20:01.563Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T07:20:02.500Z] Watchdog — GET pod status
[2026-05-26T07:20:03.076Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:20:03.158Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:20:44.276Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:20:54.362Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:21:04.627Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:21:04.706Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:21:14.807Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:21:24.947Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:30:01.352Z] Watchdog — secrets loaded
[2026-05-26T07:30:01.353Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T07:30:02.333Z] Watchdog — GET pod status
[2026-05-26T07:30:02.929Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:30:03.014Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:30:44.331Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:30:54.416Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:31:04.507Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:31:04.660Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:31:14.741Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:31:24.885Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:40:01.763Z] Watchdog — secrets loaded
[2026-05-26T07:40:01.763Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T07:40:02.716Z] Watchdog — GET pod status
[2026-05-26T07:40:03.350Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:40:03.476Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:40:44.527Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:40:54.649Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:41:04.793Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:41:05.089Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:41:15.175Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:41:25.361Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:50:01.828Z] Watchdog — secrets loaded
[2026-05-26T07:50:01.829Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T07:50:02.910Z] Watchdog — GET pod status
[2026-05-26T07:50:03.478Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:50:03.570Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:50:45.050Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:50:55.138Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:51:05.276Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T07:51:05.364Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:51:15.442Z] Watchdog — GET /api/tags model list check
[2026-05-26T07:51:25.633Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:00:01.310Z] Watchdog — secrets loaded
[2026-05-26T08:00:01.310Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T08:00:02.283Z] Watchdog — GET pod status
[2026-05-26T08:00:02.913Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:00:03.009Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:00:44.259Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:00:54.348Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:01:04.497Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:01:04.628Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:01:14.745Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:01:24.896Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:10:01.453Z] Watchdog — secrets loaded
[2026-05-26T08:10:01.453Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T08:10:02.490Z] Watchdog — GET pod status
[2026-05-26T08:10:03.143Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:10:03.276Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:10:44.512Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:10:54.627Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:11:04.770Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:11:04.914Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:11:14.999Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:11:25.097Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:20:01.680Z] Watchdog — secrets loaded
[2026-05-26T08:20:01.680Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T08:20:02.705Z] Watchdog — GET pod status
[2026-05-26T08:20:03.342Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:20:03.427Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:20:44.626Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:20:54.716Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:21:04.863Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:21:05.000Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:21:15.089Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:21:25.188Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:30:01.893Z] Watchdog — secrets loaded
[2026-05-26T08:30:01.893Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T08:30:03.608Z] Watchdog — GET pod status
[2026-05-26T08:30:04.237Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:30:04.328Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:30:45.496Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:30:55.586Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:31:05.726Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:31:05.860Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:31:15.951Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:31:26.053Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:40:01.319Z] Watchdog — secrets loaded
[2026-05-26T08:40:01.319Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T08:40:02.321Z] Watchdog — GET pod status
[2026-05-26T08:40:02.767Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:40:02.851Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:40:44.142Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:40:54.224Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:41:04.324Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:41:04.480Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:41:14.607Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:41:24.700Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:50:01.401Z] Watchdog — secrets loaded
[2026-05-26T08:50:01.401Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T08:50:02.391Z] Watchdog — GET pod status
[2026-05-26T08:50:02.823Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:50:02.908Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:50:44.431Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:50:54.555Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:51:04.695Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T08:51:04.839Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:51:14.956Z] Watchdog — GET /api/tags model list check
[2026-05-26T08:51:25.112Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:00:01.185Z] Watchdog — secrets loaded
[2026-05-26T09:00:01.185Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T09:00:02.133Z] Watchdog — GET pod status
[2026-05-26T09:00:02.792Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:00:02.909Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:00:43.852Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:00:53.948Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:01:04.098Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:01:04.388Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:01:14.488Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:01:24.647Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:10:01.746Z] Watchdog — secrets loaded
[2026-05-26T09:10:01.746Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T09:10:02.700Z] Watchdog — GET pod status
[2026-05-26T09:10:03.127Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:10:03.209Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:10:44.422Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:10:54.505Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:11:04.593Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:11:04.730Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:11:14.817Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:11:24.909Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:20:01.373Z] Watchdog — secrets loaded
[2026-05-26T09:20:01.374Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T09:20:02.316Z] Watchdog — GET pod status
[2026-05-26T09:20:02.927Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:20:03.056Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:20:44.262Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:20:54.345Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:21:04.496Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:21:04.632Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:21:14.725Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:21:24.822Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:30:01.909Z] Watchdog — secrets loaded
[2026-05-26T09:30:01.909Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T09:30:03.757Z] Watchdog — GET pod status
[2026-05-26T09:30:04.198Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:30:04.278Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:30:45.407Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:30:55.495Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:31:05.780Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:31:05.868Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:31:15.956Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:31:26.093Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:40:01.724Z] Watchdog — secrets loaded
[2026-05-26T09:40:01.724Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T09:40:02.699Z] Watchdog — GET pod status
[2026-05-26T09:40:03.352Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:40:03.472Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:40:44.610Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:40:54.697Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:41:04.978Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:41:05.112Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:41:15.195Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:41:25.286Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:50:02.023Z] Watchdog — secrets loaded
[2026-05-26T09:50:02.023Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T09:50:03.823Z] Watchdog — GET pod status
[2026-05-26T09:50:04.400Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:50:04.485Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:50:45.618Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:50:55.709Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:51:05.981Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T09:51:06.119Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:51:16.204Z] Watchdog — GET /api/tags model list check
[2026-05-26T09:51:26.343Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:00:01.891Z] Watchdog — secrets loaded
[2026-05-26T10:00:01.891Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T10:00:02.831Z] Watchdog — GET pod status
[2026-05-26T10:00:03.418Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:00:03.514Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:00:44.609Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:00:54.693Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:01:04.834Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:01:04.974Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:01:15.067Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:01:25.222Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:10:01.079Z] Watchdog — secrets loaded
[2026-05-26T10:10:01.079Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T10:10:02.353Z] Watchdog — GET pod status
[2026-05-26T10:10:02.801Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:10:02.896Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:10:44.326Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:10:54.456Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:11:04.601Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:11:04.690Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:11:14.783Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:11:24.916Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:20:01.681Z] Watchdog — secrets loaded
[2026-05-26T10:20:01.681Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T10:20:02.628Z] Watchdog — GET pod status
[2026-05-26T10:20:03.272Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:20:03.384Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:20:44.501Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:20:54.597Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:21:04.735Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:21:04.868Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:21:14.973Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:21:25.104Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:30:01.715Z] Watchdog — secrets loaded
[2026-05-26T10:30:01.715Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T10:30:02.651Z] Watchdog — GET pod status
[2026-05-26T10:30:03.225Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:30:03.318Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:30:44.434Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:30:54.555Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:31:04.644Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:31:04.775Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:31:14.862Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:31:25.148Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:40:01.741Z] Watchdog — secrets loaded
[2026-05-26T10:40:01.741Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T10:40:03.562Z] Watchdog — GET pod status
[2026-05-26T10:40:04.148Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:40:04.234Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:40:45.223Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:40:55.314Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:41:05.580Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:41:05.721Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:41:15.803Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:41:25.939Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:50:01.533Z] Watchdog — secrets loaded
[2026-05-26T10:50:01.533Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T10:50:02.743Z] Watchdog — GET pod status
[2026-05-26T10:50:03.389Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:50:03.516Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:50:44.577Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:50:54.699Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:51:04.847Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T10:51:05.120Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:51:15.208Z] Watchdog — GET /api/tags model list check
[2026-05-26T10:51:25.356Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:00:01.962Z] Watchdog — secrets loaded
[2026-05-26T11:00:01.962Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T11:00:03.215Z] Watchdog — GET pod status
[2026-05-26T11:00:03.779Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:00:03.866Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:00:44.775Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:00:54.857Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:01:05.135Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:01:05.277Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:01:15.394Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:01:25.492Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:10:01.321Z] Watchdog — secrets loaded
[2026-05-26T11:10:01.322Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T11:10:02.306Z] Watchdog — GET pod status
[2026-05-26T11:10:02.876Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:10:02.965Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:10:44.048Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:10:54.141Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:11:04.579Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:11:04.727Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:11:14.833Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:11:24.970Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:20:01.555Z] Watchdog — secrets loaded
[2026-05-26T11:20:01.556Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T11:20:02.580Z] Watchdog — GET pod status
[2026-05-26T11:20:03.172Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:20:03.255Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:20:44.338Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:20:54.433Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:21:04.566Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:21:04.706Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:21:14.829Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:21:24.924Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:30:01.096Z] Watchdog — secrets loaded
[2026-05-26T11:30:01.096Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T11:30:02.148Z] Watchdog — GET pod status
[2026-05-26T11:30:02.778Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:30:02.866Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:30:44.119Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:30:54.239Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:31:04.336Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:31:04.470Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:31:14.554Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:31:24.696Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:40:01.406Z] Watchdog — secrets loaded
[2026-05-26T11:40:01.406Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T11:40:02.407Z] Watchdog — GET pod status
[2026-05-26T11:40:02.988Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:40:03.111Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:40:44.065Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:40:54.155Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:41:04.290Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:41:04.390Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:41:14.491Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:41:24.777Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:50:01.284Z] Watchdog — secrets loaded
[2026-05-26T11:50:01.284Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T11:50:02.281Z] Watchdog — GET pod status
[2026-05-26T11:50:02.941Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:50:03.027Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:50:44.089Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:50:54.174Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:51:04.448Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T11:51:04.540Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:51:14.622Z] Watchdog — GET /api/tags model list check
[2026-05-26T11:51:24.764Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:00:01.332Z] Watchdog — secrets loaded
[2026-05-26T12:00:01.332Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T12:00:02.298Z] Watchdog — GET pod status
[2026-05-26T12:00:02.863Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:00:02.956Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:00:44.098Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:00:54.185Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:01:04.337Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:01:04.607Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:01:14.699Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:01:24.837Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:10:01.429Z] Watchdog — secrets loaded
[2026-05-26T12:10:01.429Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T12:10:02.479Z] Watchdog — GET pod status
[2026-05-26T12:10:02.980Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:10:03.062Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:10:44.371Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:10:54.452Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:11:04.585Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:11:04.852Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:11:14.951Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:11:25.094Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:20:01.785Z] Watchdog — secrets loaded
[2026-05-26T12:20:01.785Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T12:20:02.726Z] Watchdog — GET pod status
[2026-05-26T12:20:03.121Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:20:03.220Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:20:44.386Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:20:54.480Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:21:04.617Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:21:04.711Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:21:14.796Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:21:24.944Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:30:01.418Z] Watchdog — secrets loaded
[2026-05-26T12:30:01.418Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T12:30:02.415Z] Watchdog — GET pod status
[2026-05-26T12:30:02.819Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:30:02.911Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:30:44.374Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:30:54.462Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:31:04.613Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:31:04.773Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:31:14.870Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:31:25.018Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:40:01.604Z] Watchdog — secrets loaded
[2026-05-26T12:40:01.604Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T12:40:02.595Z] Watchdog — GET pod status
[2026-05-26T12:40:03.218Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:40:03.309Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:40:44.628Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:40:54.714Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:41:04.851Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:41:04.993Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:41:15.093Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:41:25.233Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:50:01.903Z] Watchdog — secrets loaded
[2026-05-26T12:50:01.903Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T12:50:03.547Z] Watchdog — GET pod status
[2026-05-26T12:50:04.157Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:50:04.277Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:50:45.225Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:50:55.303Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:51:05.457Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T12:51:05.546Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:51:15.629Z] Watchdog — GET /api/tags model list check
[2026-05-26T12:51:25.916Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:00:01.613Z] Watchdog — secrets loaded
[2026-05-26T13:00:01.613Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T13:00:02.597Z] Watchdog — GET pod status
[2026-05-26T13:00:03.218Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:00:03.342Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:00:44.411Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:00:54.504Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:01:04.644Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:01:04.787Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:01:14.905Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:01:25.090Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:10:01.778Z] Watchdog — secrets loaded
[2026-05-26T13:10:01.778Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T13:10:02.674Z] Watchdog — GET pod status
[2026-05-26T13:10:03.330Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:10:03.426Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:10:44.519Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:10:54.640Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:11:04.779Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:11:04.910Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:11:14.993Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:11:25.134Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:20:01.067Z] Watchdog — secrets loaded
[2026-05-26T13:20:01.067Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T13:20:02.127Z] Watchdog — GET pod status
[2026-05-26T13:20:02.753Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:20:02.893Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:20:43.802Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:20:53.880Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:21:04.183Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:21:04.327Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:21:14.451Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:21:24.604Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:30:01.195Z] Watchdog — secrets loaded
[2026-05-26T13:30:01.196Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T13:30:02.177Z] Watchdog — GET pod status
[2026-05-26T13:30:02.777Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:30:02.862Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:30:43.845Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:30:53.928Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:31:04.193Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:31:04.472Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:31:14.552Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:31:24.649Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:40:01.417Z] Watchdog — secrets loaded
[2026-05-26T13:40:01.418Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T13:40:02.644Z] Watchdog — GET pod status
[2026-05-26T13:40:03.277Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:40:03.370Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:40:44.558Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:40:54.648Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:41:04.738Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:41:04.880Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:41:14.968Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:41:25.067Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:50:01.274Z] Watchdog — secrets loaded
[2026-05-26T13:50:01.274Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T13:50:02.205Z] Watchdog — GET pod status
[2026-05-26T13:50:02.657Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:50:02.738Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:50:43.902Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:50:53.984Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:51:04.118Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T13:51:04.211Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:51:14.294Z] Watchdog — GET /api/tags model list check
[2026-05-26T13:51:24.557Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:00:01.563Z] Watchdog — secrets loaded
[2026-05-26T14:00:01.563Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T14:00:02.491Z] Watchdog — GET pod status
[2026-05-26T14:00:02.913Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:00:03.021Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:00:44.340Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:00:54.436Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:01:04.580Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:01:04.714Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:01:14.805Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:01:24.957Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:10:01.635Z] Watchdog — secrets loaded
[2026-05-26T14:10:01.635Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T14:10:02.618Z] Watchdog — GET pod status
[2026-05-26T14:10:03.081Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:10:03.173Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:10:44.505Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:10:54.637Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:11:04.727Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:11:04.863Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:11:14.966Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:11:25.102Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:20:01.812Z] Watchdog — secrets loaded
[2026-05-26T14:20:01.812Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T14:20:02.766Z] Watchdog — GET pod status
[2026-05-26T14:20:03.358Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:20:03.449Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:20:44.197Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:20:54.319Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:21:04.622Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:21:04.903Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:21:14.995Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:21:25.141Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:30:01.794Z] Watchdog — secrets loaded
[2026-05-26T14:30:01.794Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T14:30:03.212Z] Watchdog — GET pod status
[2026-05-26T14:30:03.852Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:30:03.977Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:30:44.962Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:30:55.043Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:31:05.381Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:31:05.517Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:31:15.610Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:31:25.752Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:40:01.243Z] Watchdog — secrets loaded
[2026-05-26T14:40:01.243Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T14:40:02.190Z] Watchdog — GET pod status
[2026-05-26T14:40:02.843Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:40:02.945Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:40:44.059Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:40:54.175Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:41:04.312Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:41:04.448Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:41:14.536Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:41:24.727Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:50:01.523Z] Watchdog — secrets loaded
[2026-05-26T14:50:01.524Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T14:50:02.483Z] Watchdog — GET pod status
[2026-05-26T14:50:03.117Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:50:03.205Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:50:44.337Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:50:54.429Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:51:04.533Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T14:51:04.676Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:51:14.784Z] Watchdog — GET /api/tags model list check
[2026-05-26T14:51:24.929Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:00:01.526Z] Watchdog — secrets loaded
[2026-05-26T15:00:01.526Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T15:00:02.840Z] Watchdog — GET pod status
[2026-05-26T15:00:03.438Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:00:03.529Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:00:44.612Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:00:54.705Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:01:04.989Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:01:05.136Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:01:15.223Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:01:25.364Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:10:01.335Z] Watchdog — secrets loaded
[2026-05-26T15:10:01.335Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T15:10:02.644Z] Watchdog — GET pod status
[2026-05-26T15:10:03.262Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:10:03.352Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:10:44.635Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:10:54.713Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:11:04.846Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:11:04.934Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:11:15.016Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:11:25.196Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:20:01.399Z] Watchdog — secrets loaded
[2026-05-26T15:20:01.400Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T15:20:02.620Z] Watchdog — GET pod status
[2026-05-26T15:20:03.223Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:20:03.344Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:20:44.433Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:20:54.557Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:21:04.699Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:21:04.812Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:21:14.895Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:21:25.032Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:30:01.803Z] Watchdog — secrets loaded
[2026-05-26T15:30:01.803Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T15:30:02.758Z] Watchdog — GET pod status
[2026-05-26T15:30:03.387Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:30:03.507Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:30:44.627Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:30:54.719Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:31:04.816Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:31:05.083Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:31:15.207Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:31:25.305Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:40:01.787Z] Watchdog — secrets loaded
[2026-05-26T15:40:01.787Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T15:40:03.609Z] Watchdog — GET pod status
[2026-05-26T15:40:04.224Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:40:04.310Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:40:45.391Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:40:55.516Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:41:05.662Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:41:05.969Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:41:16.060Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:41:26.180Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:50:01.723Z] Watchdog — secrets loaded
[2026-05-26T15:50:01.723Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T15:50:03.156Z] Watchdog — GET pod status
[2026-05-26T15:50:03.782Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:50:03.904Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:50:45.017Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:50:55.109Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:51:05.255Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T15:51:05.391Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:51:15.481Z] Watchdog — GET /api/tags model list check
[2026-05-26T15:51:25.609Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:00:01.895Z] Watchdog — secrets loaded
[2026-05-26T16:00:01.896Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T16:00:03.162Z] Watchdog — GET pod status
[2026-05-26T16:00:03.799Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:00:03.886Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:00:45.217Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:00:55.305Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:01:05.443Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:01:05.534Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:01:15.621Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:01:25.779Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:10:01.852Z] Watchdog — secrets loaded
[2026-05-26T16:10:01.853Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T16:10:03.226Z] Watchdog — GET pod status
[2026-05-26T16:10:03.807Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:10:03.934Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:10:45.040Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:10:55.132Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:11:05.275Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:11:05.405Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:11:15.490Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:11:25.631Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:20:01.940Z] Watchdog — secrets loaded
[2026-05-26T16:20:01.940Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T16:20:03.002Z] Watchdog — GET pod status
[2026-05-26T16:20:03.648Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:20:03.733Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:20:45.029Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:20:55.117Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:21:05.260Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:21:05.405Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:21:15.496Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:21:25.630Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:30:01.740Z] Watchdog — secrets loaded
[2026-05-26T16:30:01.740Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T16:30:02.696Z] Watchdog — GET pod status
[2026-05-26T16:30:03.363Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:30:03.440Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:30:44.547Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:30:54.638Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:31:04.792Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:31:04.934Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:31:15.058Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:31:25.205Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:40:01.328Z] Watchdog — secrets loaded
[2026-05-26T16:40:01.328Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T16:40:02.672Z] Watchdog — GET pod status
[2026-05-26T16:40:03.115Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:40:03.213Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:40:44.294Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:40:54.380Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:41:04.517Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:41:04.607Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:41:14.688Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:41:24.831Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:50:01.913Z] Watchdog — secrets loaded
[2026-05-26T16:50:01.913Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T16:50:03.276Z] Watchdog — GET pod status
[2026-05-26T16:50:03.905Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:50:04.031Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:50:44.971Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:50:55.059Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:51:05.335Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T16:51:05.631Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:51:15.753Z] Watchdog — GET /api/tags model list check
[2026-05-26T16:51:25.897Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:00:02.029Z] Watchdog — secrets loaded
[2026-05-26T17:00:02.029Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T17:00:04.110Z] Watchdog — GET pod status
[2026-05-26T17:00:04.745Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:00:04.832Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:00:46.110Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:00:56.199Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:01:06.337Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:01:06.482Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:01:16.575Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:01:26.712Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:10:01.874Z] Watchdog — secrets loaded
[2026-05-26T17:10:01.874Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T17:10:02.840Z] Watchdog — GET pod status
[2026-05-26T17:10:03.530Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:10:03.655Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:10:44.618Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:10:54.708Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:11:04.860Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:11:04.998Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:11:15.083Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:11:25.359Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:20:01.718Z] Watchdog — secrets loaded
[2026-05-26T17:20:01.718Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T17:20:02.735Z] Watchdog — GET pod status
[2026-05-26T17:20:03.355Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:20:03.481Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:20:44.436Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:20:54.545Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:21:04.684Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:21:04.829Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:21:14.917Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:21:25.006Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:30:01.360Z] Watchdog — secrets loaded
[2026-05-26T17:30:01.360Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T17:30:02.521Z] Watchdog — GET pod status
[2026-05-26T17:30:03.121Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:30:03.209Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:30:44.410Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:30:54.499Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:31:04.778Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:31:04.906Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:31:15.010Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:31:25.100Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:40:01.507Z] Watchdog — secrets loaded
[2026-05-26T17:40:01.507Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T17:40:02.431Z] Watchdog — GET pod status
[2026-05-26T17:40:02.861Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:40:02.969Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:40:44.118Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:40:54.203Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:41:04.495Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:41:04.823Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:41:14.922Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:41:32.238Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:50:01.454Z] Watchdog — secrets loaded
[2026-05-26T17:50:01.454Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T17:50:02.520Z] Watchdog — GET pod status
[2026-05-26T17:50:04.370Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:50:04.447Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:51:04.753Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:51:14.887Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T17:51:34.907Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:51:45.040Z] Watchdog — GET /api/tags model list check
[2026-05-26T17:51:58.939Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:00:01.107Z] Watchdog — secrets loaded
[2026-05-26T18:00:01.107Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T18:00:02.138Z] Watchdog — GET pod status
[2026-05-26T18:00:02.839Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:00:02.964Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:00:46.715Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:00:56.803Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:01:06.944Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:01:07.052Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:01:17.144Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:01:30.484Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:10:01.964Z] Watchdog — secrets loaded
[2026-05-26T18:10:01.964Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T18:10:03.532Z] Watchdog — GET pod status
[2026-05-26T18:10:04.197Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:10:04.282Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:10:45.288Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:10:55.389Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:11:05.476Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:11:05.616Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:11:15.719Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:11:26.031Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:20:02.074Z] Watchdog — secrets loaded
[2026-05-26T18:20:02.074Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T18:20:03.906Z] Watchdog — GET pod status
[2026-05-26T18:20:04.603Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:20:04.731Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:20:45.914Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:20:56.018Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:21:06.168Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:21:06.453Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:21:16.546Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:21:26.693Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:30:01.948Z] Watchdog — secrets loaded
[2026-05-26T18:30:01.948Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T18:30:03.969Z] Watchdog — GET pod status
[2026-05-26T18:30:04.635Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:30:04.765Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:30:45.959Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:30:56.107Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:31:06.205Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:31:06.356Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:31:16.454Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:31:26.595Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:40:01.810Z] Watchdog — secrets loaded
[2026-05-26T18:40:01.810Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T18:40:02.991Z] Watchdog — GET pod status
[2026-05-26T18:40:03.635Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:40:03.728Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:40:44.933Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:40:55.041Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:41:05.189Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:41:05.329Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:41:15.414Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:41:25.524Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:50:01.176Z] Watchdog — secrets loaded
[2026-05-26T18:50:01.176Z] Watchdog — gpu-auth-proxy config loaded
[2026-05-26T18:50:02.213Z] Watchdog — GET pod status
[2026-05-26T18:50:02.842Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:50:02.941Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:50:44.078Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:50:54.162Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:51:04.309Z] Watchdog — GET /api/tags via proxy with valid token
[2026-05-26T18:51:04.480Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:51:14.577Z] Watchdog — GET /api/tags model list check
[2026-05-26T18:51:24.717Z] Watchdog — GET /api/tags model list check
