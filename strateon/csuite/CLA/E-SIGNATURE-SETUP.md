# E-Signature Setup for Strateon / Qiyadon

**Status:** IMPLEMENTED
**Date:** 2026-05-01
**Author:** CLA / CTO (subagent)
**Platform Recommendation:** Dropbox Sign (formerly HelloSign)

---

## 1. Executive Summary

**Recommended Platform: Dropbox Sign**

| Criteria | Result |
|---|---|
| Best free tier for early stage | ✅ Dropbox Sign (3 docs/month free, no credit card required) |
| EU client friendly (eIDAS compliant) | ✅ Yes — fully compliant |
| Works with Delaware governing law | ✅ Yes — courts accept globally |
| Easy <10 min setup | ✅ Yes |
| Estimated cost start | $0 (free tier) → $15/user/month when ready |

---

## 2. Platform Comparison

### Top 4 E-Signature Platforms

| Feature | **Dropbox Sign** | DocuSign | PandaDoc | Adobe Sign |
|---|---|---|---|---|
| **Free tier** | 3 docs/month | 3 docs/month | No free tier | No free tier |
| **Paid pricing** | ~$15/user/month | ~$25/user/month | ~$19/user/month | ~$20/user/month |
| **Per-document send** | Yes (no subscription needed) | No | Yes | Yes |
| **EU/eIDAS compliance** | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Delaware law contracts** | ✅ Fully accepted | ✅ Fully accepted | ✅ Fully accepted | ✅ Fully accepted |
| **International clients** | ✅ Strong | ✅ Strong | ✅ Strong | ✅ Strong |
| **API available** | Yes | Yes | Yes | Yes |
| **Setup time** | <10 minutes | ~30 min | ~15 min | ~20 min |
| **Integrations** | Dropbox, Google, Slack, CRMs | Salesforce, Microsoft, SAP | HubSpot, Stripe | Adobe, Microsoft |

### Verdict

**Dropbox Sign is the clear choice for early-stage** because:
1. **Free tier requires no credit card** — you can start immediately
2. **3 free documents/month** is enough for initial client onboarding
3. **Fastest to set up** — Google account or email signup in <5 minutes
4. **Equally legally valid** as DocuSign for Delaware-governed contracts
5. **eIDAS compliant** for EU clients — GDPR-adjacent requirement handled
6. **Clean UX** — clients don't need an account to sign

DocuSign has brand recognition but is 2x the price and overkill at this stage.
Adobe Sign requires an Adobe subscription. PandaDoc doesn't have a free tier.

---

## 3. E-Signature for Delaware Incorporation

### Can Delaware LLC/C-Corp Be Fully Filed Online?

**Yes.** Delaware Division of Corporations accepts electronic filing for both LLC and C-Corp formations. No physical documents required.

### Service Options

| Service | What It Does | Electronic Signature | Best For |
|---|---|---|---|
| **Harvard Business Services** | Delaware LLC/C-Corp formation agent | ✅ Yes — handles full filing digitally | LLCs and Corps wanting a full-service registered agent |
| **Clerky** | Delaware C-Corp formation + equity management | ✅ Yes — fully digital | Startups that need equity / stock plans |
| **LegalZoom** | Delaware LLC/C-Corp | ✅ Yes — digital | Lower-cost, DIY approach |
| **Delaware Division of Corporations (DIY)** | Direct filing at Delaware state level | ✅ Yes — directly via their online portal | Those comfortable filing themselves |

### Recommendation for Qiyadon

**If Qiyadon is an LLC** → Harvard Business Services or Delaware Division of Corporations direct filing
**If Qiyadon is raising VC / issuing equity** → Clerky

### What Ahmad Needs to Do Digitally

1. **Choose entity type** (LLC or C-Corp) — decide before filing
2. **Pick a registered agent** — Harvard Business Services includes this
3. **Prepare formation documents** — Certificate of Formation (LLC) or Certificate of Incorporation (C-Corp)
4. **Sign digitally** — using the filing service's platform (fully online)
5. **Pay Delaware state filing fee** — ~$90-$200 depending on entity type (paid online)
6. **Receive certified copy** — returned by email from Delaware Division of Corporations

---

## 4. Client Signing Workflow

### How It Works

```
CLA drafts agreement
       ↓
Uploads to Dropbox Sign portal
       ↓
Sets signing order (Strateon first, then client)
       ↓
Client receives email with secure link (no account needed)
       ↓
Client clicks link → reviews agreement → signs in browser
       ↓
Strateon receives signed copy automatically
       ↓
Signed PDF stored / sent to client
```

### Fully Automated?

**Yes, largely.** After the initial setup:

- Template-based sending: Save agreement as a template in Dropbox Sign → send in 2 clicks
- No manual PDF handling
- No printing, no scanning, no email attachments
- Audit trail automatically generated (who signed, when, IP address, timestamp)
- Reminder emails sent automatically if client doesn't sign within X days

**Manual steps required:**
- Filling in client-specific details (name, company, date) — minor manual input
- This can be reduced by using template merge fields

---

## 5. Step-by-Step: Ahmad's Immediate Action Plan

### Right Now (< 10 minutes)

**Step 1: Sign up for Dropbox Sign**
1. Go to [dropbox.com/sign](https://www.dropbox.com/sign)
2. Click "Get started free"
3. Sign up with Google account (fastest) or email
4. **No credit card required for free tier**
5. Verify email if prompted

**Step 2: Upload Your First Template**
1. Download the updated TRIAL-AGREEMENT.md and CLIENT-SERVICE-AGREEMENT.md (with e-signature clauses now added)
2. Export as PDF
3. In Dropbox Sign → click "Send for signature"
4. Upload the PDF
5. Add your email as the first signer, client's email as second
6. Click "Send"
7. Done — client gets an email immediately

**Step 3: For Recurring Use**
1. Save each agreement as a template in Dropbox Sign
2. Name them: "Strateon Trial Agreement", "Strateon CSA"
3. Use merge fields for client name/date
4. Next client: open template → fill name → send → done

### Delaware Formation (Later)

1. Choose entity type (LLC recommended for services company)
2. Go to Harvard Business Services ([delaware-lLC.com](https://www.delaware-lbc.com)) or file directly at [corp.delaware.gov](https://corp.delaware.gov)
3. Complete online form — no printing needed
4. Sign digitally on the platform
5. Pay state fee online
6. Receive filed certificate by email

---

## 6. Legal Validity

### Is E-Signature Legally Binding?

**Yes.** Under:

- **ESIGN Act (US, 2000)** — federal law that electronic signatures are legally binding for interstate and international commerce
- **UETA (Uniform Electronic Transactions Act)** — adopted by Delaware and most US states
- **eIDAS (EU, 2016)** — EU regulation that makes e-signatures legally valid across all EU member states

### Delaware Courts

Delaware courts have consistently upheld electronic signatures as valid for contracts governed by Delaware law, including the Delaware Uniform Electronic Transactions Act (DUETA).

### What Makes a Signature Legally Valid?

1. Signer's intent to sign (clicking "Sign" = intent)
2. Clear association of signature to the document
3. Record is retained (Dropbox Sign keeps audit trail + signed PDF)

Dropbox Sign satisfies all three. ✅

---

## 7. Cost Summary

| Stage | Platform | Cost |
|---|---|---|
| Early (0–10 clients) | Dropbox Sign Free | **$0** |
| Growing (10–50 clients) | Dropbox Sign Standard | **$15/user/month** (~3 users = $45/month) |
| Delaware LLC Filing (one-time) | Harvard Business Services + Delaware state | **~$350–500 total** |
| Delaware C-Corp Filing (one-time) | Clerky + Delaware state | **~$400–600 total** |

---

## 8. What Was Updated

### Files Modified

1. **`TRIAL-AGREEMENT.md`** — Added electronic signature clause in header
2. **`CLIENT-SERVICE-AGREEMENT.md`** — Added electronic signature clause in Section 12.8 (Counterparts)

### Files Created

1. **`E-SIGNATURE-SETUP.md`** — This guide

---

## 9. Recommended Next Steps

- [ ] **Ahmad signs up for Dropbox Sign** (10 min) — use this to send the updated TRIAL-AGREEMENT.md to the first client
- [ ] **Export updated agreements as PDFs** and upload to Dropbox Sign as templates
- [ ] **Decide entity type for Qiyadon** (LLC vs C-Corp) before filing Delaware
- [ ] **If raising VC / equity needed** → use Clerky for Delaware C-Corp formation
- [ ] **If LLC / bootstrapped** → use Harvard Business Services or file directly
- [ ] **Consider Dropbox Sign Standard plan** ($15/user/month) when sending >3 docs/month regularly

---

*Document prepared by CLA/CTO subagent — 2026-05-01*
*For questions, tag Moosa for follow-up.*