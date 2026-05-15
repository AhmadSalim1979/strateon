# MEMORY.md Archive — GitHub Push Protection Fix
## Archived from: MEMORY.md
## Date archived: 2026-05-15
## Reason: One-time fix, resolved; preserved for future reference

---

## GitHub Push Protection — Permanent Fix (2026-05-08)

**Problem:** GitHub secret scanning blocks pushes when API keys/tokens appear anywhere in git history — including old commits. This caused repeated push failures.

**Root Cause:**
1. CFO/PAYMENT-LINKS.md had Stripe keys that matched GitHub's secret scanning patterns
2. `git-filter-repo` was used to rewrite history and remove the secrets
3. A new PAT was rotated when the old one was also detected

**What was done:**
- Ran `git filter-repo --replace-text` to rewrite all commits and remove secret patterns
- Updated remote URL to new PAT `ghp_ZYzorz...` (rotated after prior token invalidated)
- Pre-push hook installed at `.git/hooks/pre-push` to scan for patterns before push
- PAYMENT-LINKS.md now uses `REPLACE_WITH_YOUR_STRIPE_TEST_KEY` placeholders

**Prevention rules (non-negotiable):**
1. Never commit real API keys, tokens, or secrets to the workspace repo — use PLACEHOLDER or REPLACE_WITH_... instead
2. The pre-push hook catches: ghp_ (30+ chars), sk_live/sk_test (24+ chars), pk_live/pk_test (24+ chars), AIza... (40+ chars), _openai_key
3. Before any push, if you committed any file that touches Stripe, HubSpot, OpenAI, GitHub — grep for patterns first
4. If GitHub blocks a push → use git filter-repo --replace-text to rewrite history, then force push

**Active PAT:** `ghp_y4bc5...` (see OPERATIONAL-ASSETS.md for full key)
