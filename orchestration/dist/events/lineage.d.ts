/**
 * Event Lineage — Tracing and Correlation Improvements
 * Phase 3: Tracks event chains through correlation_id and hop_count enforcement
 *
 * Every event has:
 * - event_id: unique identifier (UUID)
 * - correlation_id: links related events in a flow (propagated from parent)
 * - hop_count: how many processing hops this event has gone through
 *
 * Lineage tracing ensures:
 * - Events from the same flow can be queried together
 * - Hop count prevents infinite event loops
 * - Event chain integrity is verifiable
 *
 * Shadow-safe: does not affect production behavior.
 */
import { OrchestrationEvent } from './event-schemas';
/**
 * Lineage context — carries tracing information through an event chain.
 */
export interface LineageContext {
    correlation_id: string;
    root_event_id?: string;
    parent_event_id?: string;
    hop_count: number;
}
/**
 * Create a new lineage context for a root event.
 */
export declare function createRootLineage(correlation_id: string, event_id: string): LineageContext;
/**
 * Create a child lineage context (for events spawned from processing a parent).
 * Increments hop_count and propagates correlation_id.
 */
export declare function createChildLineage(parent: OrchestrationEvent, newEventId: string): LineageContext;
/**
 * Create a child event from a parent event.
 * Preserves lineage: correlation_id, root_event_id, parent_event_id, hop_count.
 */
export declare function createChildEvent(parent: OrchestrationEvent, eventType: string, source: string, payload: object): OrchestrationEvent;
/**
 * Check if an event has exceeded the maximum hop count.
 * Events that exceed max hops should be stopped to prevent infinite loops.
 */
export declare function isHopCountExceeded(event: OrchestrationEvent, maxHops: number): boolean;
/**
 * Validate event chain integrity.
 * Returns errors if the chain is broken or suspicious.
 */
export declare function validateLineage(event: OrchestrationEvent): {
    valid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * Format event lineage as a human-readable string.
 */
export declare function formatLineage(event: OrchestrationEvent): string;
/**
 * Extract lineage summary from an event for logging.
 */
export declare function getLineageSummary(event: OrchestrationEvent): {
    event_id: string;
    correlation_id: string | null;
    hop_count: number;
    chain_position: 'root' | 'intermediate' | 'deep';
};
/**
 * Build an event chain summary from multiple events.
 * Useful for debugging complex event flows.
 */
export declare function buildEventChainSummary(events: OrchestrationEvent[]): {
    root_event_id: string | null;
    chain_length: number;
    max_hop_count: number;
    event_types: string[];
    correlation_ids: string[];
    has_loops: boolean;
};
/**
 * Log lineage information for an event.
 */
export declare function logLineage(event: OrchestrationEvent, context?: string): void;
//# sourceMappingURL=lineage.d.ts.map