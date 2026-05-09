# HubSpot Dual-Write Validator
## Internal Implementation Note
**Status:** IDENTIFIED — Buildable
**Created:** 2026-05-09

---

## Problem

Pipeline execution sends data to HubSpot. When the data is malformed or missing required fields, HubSpot rejects it silently or partially updates. This causes:
- CRM data quality degradation
- Silent failures (Qiyadon thinks data was written, it wasn't)
- Client-facing pipeline failures that are hard to debug

## Solution

Before sending any data to HubSpot, run it through a validation layer:

```javascript
// Pseudo-code
function validateHubSpotWrite(payload, objectType) {
  const requiredFields = HUBSPOT_REQUIRED_FIELDS[objectType]; // e.g., contact requires email, company
  const missing = requiredFields.filter(field => !payload[field]);
  
  if (missing.length > 0) {
    emitAuditEvent('hubspot_validation_failed', { missing, payload });
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Check data types
  const typeCheck = requiredFields.map(field => ({
    field,
    expected: HUBSPOT_FIELD_TYPES[field],
    actual: typeof payload[field]
  })).filter(({ expected, actual }) => expected !== actual);
  
  if (typeCheck.length > 0) {
    emitAuditEvent('hubspot_type_mismatch', { typeCheck, payload });
    throw new TypeError(`Type mismatches: ${typeCheck.map(t => `${t.field}`).join(', ')}`);
  }
  
  return true; // Validated
}
```

## Required Fields by Object Type (Draft)

| Object | Required Fields |
|---|---|
| Contact | email |
| Company | name |
| Deal | dealname, pipeline, dealstage |
| Line Item | hs_product_id, quantity |
| Ticket | subject, pipeline, ticket_state |

## Audit Events

- `hubspot_validation_failed` — missing required fields (before send attempt)
- `hubspot_type_mismatch` — type errors (before send attempt)
- `hubspot_write_success` — successful write
- `hubspot_write_rejected` — HubSpot API rejection (after validation)

## Next Steps

1. Confirm exact HubSpot API field requirements for each object type
2. Build validation function in pipeline executor
3. Wire into error_reports for failed validation events
4. Add to Phase 2 audit trail scope

---

## Integration with Existing Governance

This is Phase 2 Audit Trail scope — it generates audit events that feed into the governance report. It should be built as part of Phase 2, not separately.
