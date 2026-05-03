# STRATEON CMO — ASSET MANAGEMENT RULES
## Governance Policy | Version 1.0 | Effective 2026-04-26

**Owner:** CMO (Moosa)  
**Applies To:** All brand assets, design files, and creative produced on behalf of Qiyadon  
**Board Mandate:** The CMO is the sole custodian of the Qiyadon brand asset library.

---

## 🎯 PURPOSE

To ensure that every approved brand asset is properly filed, documented, and accessible — so the Board never has to ask "where is the logo?" or "is this the latest version?"

---

## 📜 RULE 1: 24-HOUR FILING REQUIREMENT

**Every approved asset must be saved to the ASSETS/ directory within 24 hours of approval.**

Process:
1. Asset is approved by CMO (or Board with CMO concurrence)
2. CMO saves the asset file to `strateon/csuite/CMO/ASSETS/`
3. CMO creates or updates the corresponding `strateon-asset-[number]-[name]-[version].md` spec file
4. CMO updates `ASSETS/README.md` to include the new asset in the register
5. Timestamp of filing recorded in the spec file

**Deadline:** 24 hours. No exceptions for "I'll file it next week."

---

## 📜 RULE 2: ALL REVIEWS MUST BE DOCUMENTED

**Every asset review — approved, rejected, or needs revision — must be saved to the workspace.**

This means:
- Approved assets → create spec file + update README
- Rejected assets → note in the spec file with rejection reason
- Needs Revision assets → note in spec file with specific revision requirements
- Board feedback on assets → logged by CMO in the relevant spec file

**The workspace is the record of truth. Slack threads and WhatsApp messages are not.**

---

## 📜 RULE 3: CMO IS THE ASSET LIBRARIAN — NOT THE BOARD

**The CMO is responsible for the brand asset library. The Board is not.**

What this means:
- Board members do NOT maintain the asset library. They request assets from the CMO.
- CMO is the single point of contact for: "What is the approved logo?" / "Where is the latest version?" / "Can I get the source file?"
- Board members who create or commission assets must hand them to the CMO for filing — not maintain their own copies.
- The Board sets strategy and brand direction. The CMO executes and maintains.

---

## 📜 RULE 4: FILENAME CONVENTION

**All asset spec files must follow this naming convention:**

```
strateon-asset-[number]-[name]-[version].md
```

Examples:
```
strateon-asset-001-logo-primary-v2.md
strateon-asset-002-icon-favicon-v3.md
strateon-asset-003-service-one-pager-v1.md
```

Rules:
- Number: 3 digits, starting at 001, incrementing sequentially
- Name: Short identifier (hyphenated if needed), lowercase
- Version: `v1`, `v2`, `v3` — matching the asset version
- Always `.md` extension

**Rationale:** Sequential numbering ensures a complete, ordered register. No two assets share a number.

---

## 📜 RULE 5: ASSET VERSIONING

- **Never reuse a version number.** V1 → V2, not V1 (revised).
- When an asset is superseded, the old spec file remains — it becomes the historical record.
- Only the **highest version number** is considered "current approved."
- If a new version is identical to the current (e.g., a re-export), it does NOT get a new version number.

---

## 📜 RULE 6: SOURCE FILE MANAGEMENT

- Source files (AI, PSD, SKETCH, FIGMA) must be stored alongside or referenced in the spec file.
- If a source file cannot be stored in the workspace, the spec file must contain a link/path to where it lives.
- Canva exports are NOT acceptable as source files — use native files where possible.

---

## 📜 RULE 7: WHATSAPP MEDIA PATH RECORDING

- Every asset that originated from WhatsApp must have its WhatsApp media path recorded in the spec file.
- Format: `media/whatsapp/[original-filename].[ext]`
- If the path is unknown, the spec file must note: `⚠️ WhatsApp path unknown — CEO to retrieve`
- The CMO is responsible for chasing down missing media, not the Board.

---

## 📜 RULE 8: ASSET REQUESTS

| Request Type | SLA | Owner |
|-------------|-----|-------|
| "Where is asset X?" | Immediate | CMO |
| "Can I get a copy of asset X?" | Same day | CMO |
| "We need a new asset for Y" | Scope + quote within 48h | CMO + design team |
| "Can this asset be modified?" | Review within 24h | CMO |

---

## 📜 RULE 9: UNAUTHORIZED USE OF ASSETS

Any Board member or employee who uses a non-approved asset (status ≠ Approved) in a public-facing context must:
1. Stop immediately
2. Notify the CMO
3. Replace with the approved version from the ASSETS/ directory

Use of rejected or unfiled assets is a brand governance breach and must be disclosed to the Board.

---

## 📋 CURRENT ASSET REGISTER (as of 2026-04-26)

| # | Asset | Version | Status |
|---|-------|---------|--------|
| 001 | Primary Logo (Horizontal) | V2 | ✅ Approved |
| 002 | Icon / Favicon | V3 | ✅ Approved |
| 003 | Service One-Pager | V1 | ✅ Approved |
| 004 | Launch Post Card | V1 | ✅ Approved |
| 005 | LinkedIn Banner | V1 | ✅ Approved |
| 006 | Social Profile Image | V1 | ✅ Approved |
| 007 | Pitch Deck Cover | V1 | ✅ Approved |
| 008 | Product App Mockup | V1 | ✅ Approved |
| 009 | Brand Color Palette | V1 | ✅ Approved |
| 010 | Typography System | V1 | ✅ Approved |

**Total: 10 assets filed. All Approved.**

---

*These rules are effective immediately. The CMO is accountable to the Board for compliance. Questions → raise with Moosa.*
