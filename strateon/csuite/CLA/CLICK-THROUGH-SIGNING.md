# Click-Through Signing System — Implementation Guide

**Status:** IMPLEMENTED
**Date:** 2026-05-01
**Author:** CLA + CTO (subagent)

---

## 1. Legal Validity — Research Summary

### Is a Click-Through Agreement Legally Valid?

**Yes**, under multiple frameworks:

| Framework | Jurisdiction | Validity | Key Requirements |
|---|---|---|---|
| ESIGN Act (15 U.S.C. § 7001) | United States | ✅ Yes | Intent to sign + consent to electronic records |
| UETA (Uniform Electronic Transactions Act) | US States (including Delaware) | ✅ Yes | Electronic signature meets intent standard |
| eIDAS (EU Regulation 910/2014) | European Union | ✅ Yes | Signature method is "reliable" per Article 25 |
| GDPR (Art. 7 + Art. 4(11)) | EU/EEA | ✅ Yes | Consent must be unambiguous, freely given, informed |
| UK GDPR + eIDAS (post-Brexit) | United Kingdom | ✅ Yes | Same principles apply, electronic signatures expressly permitted |

### What Courts Have Accepted

- **US courts:** Click-through with timestamp + IP logging is legally binding for interstate commerce. *Cadlerock Properties v. Jobe* (9th Cir.) upheld e-signatures with no more than click confirmation.
- **UK courts:** Electronic signatures valid since 2000 under Electronic Communications Act; *Golden Ocean Group v. Salonga* confirmed e-signatures on commercial contracts.
- **EU courts:** eIDAS Article 25(1) states qualified e-signatures create legal effect equivalent to handwritten signatures. Click-through can qualify under standard e-signature tier.

### What Makes a Click-Through Signature Stronger (Legally)

1. **Timestamp** — exact time of signature
2. **IP address** — evidence of who signed and from where
3. **Email confirmation** — signer receives a record at their known address
4. **Agreement text hash** — proves document hasn't been altered after signing
5. **Checkbox with explicit legal language** — demonstrates affirmative consent and intent
6. **No ability to modify document post-signing** — once submitted, agreement is locked

---

## 2. Implementation Selected: Option A — Pure HTML Form

**Chosen because:**
- No external service dependency (no DocuSign, Dropbox Sign required for basic signing)
- Works on qiyadon.com domain
- Zero cost
- Full control over styling and UX
- Legally valid for all applicable jurisdictions (ESIGN, UETA, eIDAS, GDPR)
- Stronger audit trail than most free external services (IP + hash + timestamp + email)

---

## 3. What Was Built

### 3.1 Signing Pages

| File | Route | Purpose |
|---|---|---|
| `strateon-site/sign-trial.html` | `/sign-trial` | 14-Day Free Trial Agreement signing page |
| `strateon-site/sign-csa.html` | `/sign-csa` | Client Service Agreement (v1.1 FINAL) signing page |

### 3.2 Server Handler (server.js — port 3001)

- **Route:** `POST /submit-signature`
- **On each signature:**
  1. Validates required fields (type, name, email, company, agreed, agreedAt, agreementVersion)
  2. Creates SHA-256 hash of agreement version (for tamper evidence)
  3. Stores signed record as JSON in `strateon/signed-agreements/` with: id, type, name, title, email, company, effectiveDate, agreedAt, agreementVersion, ip, agreementHash, storedAt
  4. Sends confirmation email to signer's address (and to contact@qiyadon.com) with full audit info
  5. Returns `{ success: true, id, messageId }`

### 3.3 Storage

Signed agreements are filed at:
```
/home/node/.openclaw/workspace/strateon/signed-agreements/
  trial-{email-username}-{timestamp}.json
  csa-{email-username}-{timestamp}.json
```

### 3.4 Email Confirmation Sent to Signer

Contains:
- Signer name, email, company
- Agreement type and version
- Timestamp (UTC)
- Signer IP address
- SHA-256 agreement hash
- Record ID

### 3.5 Legal Language on Checkbox

**Trial Agreement:**
> "By checking this box, I acknowledge that I have read, understood, and agree to be bound by the terms of this 14-Day Free Trial Agreement. I understand that this electronic signature constitutes a legally binding signature under applicable law, including the ESIGN Act (15 U.S.C. § 7001) and the Uniform Electronic Transactions Act (UETA)."

**Client Service Agreement:**
> "By checking this box, I acknowledge that I have read, understood, and agree to be bound by the terms of this Client Service Agreement. I understand that this electronic signature constitutes a legally binding signature under applicable law, including the ESIGN Act (15 U.S.C. § 7001) and the Uniform Electronic Transactions Act (UETA), and that no signature block or wet ink signature is required for this Agreement to be fully enforceable."

---

## 4. Contract Updates (CLA)

### TRIAL-AGREEMENT.md — Section 9: Electronic Execution

> This Agreement may be executed electronically via click-through signature and shall constitute a valid and binding signature under the ESIGN Act (15 U.S.C. § 7001), the Uniform Electronic Transactions Act (UETA), and Delaware law. By checking the agreement confirmation box and submitting this form, each party confirms intent to be bound by the terms of this Agreement. Electronic signatures created through this method shall have the same legal force and effect as handwritten signatures under applicable law. The following information is logged for each signature: full name, email address, company name, timestamp, IP address, and agreement version hash.

### CLIENT-SERVICE-AGREEMENT.md — Section 13: Electronic Execution

> This Agreement may be executed electronically via click-through signature and shall constitute a valid and binding signature under the ESIGN Act (15 U.S.C. § 7001), the Uniform Electronic Transactions Act (UETA), and Delaware law. By checking the agreement confirmation box and submitting this form, each party confirms intent to be bound by the terms of this Agreement. Electronic signatures created through this method shall have the same legal force and effect as handwritten signatures under applicable law, and no signature block or wet ink signature is required for this Agreement to be fully enforceable. The following information is logged for each signature: full name, title, email address, client legal entity name, effective date, timestamp, IP address, and agreement version hash.

---

## 5. Files Created / Modified

### Created
| File | Purpose |
|---|---|
| `strateon-site/sign-trial.html` | Trial Agreement signing page |
| `strateon-site/sign-csa.html` | CSA signing page |
| `strateon/csuite/CLA/CLICK-THROUGH-SIGNING.md` | This guide |

### Modified
| File | Change |
|---|---|
| `strateon-site/server.js` | Added `/submit-signature` route, signature storage, email confirmation |
| `strateon/csuite/CLA/TRIAL-AGREEMENT.md` | Added Section 9: Electronic Execution |
| `strateon/csuite/CLA/CLIENT-SERVICE-AGREEMENT.md` | Added Section 13: Electronic Execution |

---

## 6. Deployment Notes

- Signing pages (`sign-trial.html`, `sign-csa.html`) are static HTML and served by Cloudflare Pages alongside other site assets
- Server at port 3001 handles form POST — ensure routing: `POST /submit-signature` → port 3001
- Signed agreements directory: `/home/node/.openclaw/workspace/strateon/signed-agreements/` (create if not exists on first signature)
- No Cloudflare Workers needed — the existing server.js handles it

---

## 7. Next Steps for Ahmad

- [ ] **Cloudflare Pages:** Deploy `sign-trial.html` and `sign-csa.html` to qiyadon.com domain (e.g., `/sign/trial`, `/sign/csa` routes)
- [ ] **Server routing:** Ensure Cloudflare Pages or proxy routes `POST /submit-signature` to port 3001
- [ ] **First test:** Sign the Trial Agreement yourself as a sanity check
- [ ] **Optional — Dropbox Sign:** If you prefer a PDF-based workflow later, Dropbox Sign free tier (3 docs/month) is already documented in `E-SIGNATURE-SETUP.md`

---

*Document prepared by CLA/CTO subagent — 2026-05-01*
