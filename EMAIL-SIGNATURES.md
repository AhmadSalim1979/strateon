# EMAIL SIGNATURES — DO NOT DELETE

## ASSET 1 — CONTACT@QIYADON.COM SIGNATURE
**Image:** `/root/.openclaw/media/inbound/d4e306a3-29dc-4a0f-a16a-5a513b6842f3.jpg`
**Usage:** All emails sent from contact@qiyadon.com
**Embedding:** `<img src="cid:contact-sig">` with attachment cid:contact-sig pointing to image file

---

## ASSET 5 — AHMAD.SALIM@QIYADON.COM SIGNATURE
**Image:** `/root/.openclaw/media/inbound/0832b584-738e-4677-b7c8-42b09d31bbe9.jpg`
**Usage:** All emails sent from ahmad.salim@qiyadon.com
**Embedding:** `<img src="cid:ahmad-sig">` with attachment cid:ahmad-sig pointing to image file
**SMTP auth:** auth as ahmad.salim@qiyadon.com (same password as contact@qiyadon.com)

---

## RULES
- Contact signature (Asset 1) → contact@qiyadon.com sender
- Ahmad signature (Asset 5) → ahmad.salim@qiyadon.com sender
- Always embed as inline image attachment (cid-based)
- Never add Cloudflare tokens or API keys to git-tracked files
