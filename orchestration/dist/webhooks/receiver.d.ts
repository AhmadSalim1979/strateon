/**
 * Webhook Receiver — Express app on port 3003
 * Phase 2: Internal event receiver (NOT publicly exposed)
 *
 * Receives internal orchestration events via HTTP.
 * Does NOT receive external traffic — this is an internal endpoint.
 *
 * Security: Only accepts requests with X-Internal-Secret header.
 * This prevents accidental external exposure.
 */
declare const WEBHOOK_PORT: number;
declare const INTERNAL_SECRET: string;
export declare function createWebhookReceiver(): import("express-serve-static-core").Express;
export { WEBHOOK_PORT, INTERNAL_SECRET };
//# sourceMappingURL=receiver.d.ts.map