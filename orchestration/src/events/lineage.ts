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
export function createRootLineage(correlation_id: string, event_id: string): LineageContext {
  return {
    correlation_id,
    root_event_id: event_id,
    parent_event_id: undefined,
    hop_count: 0,
  };
}

/**
 * Create a child lineage context (for events spawned from processing a parent).
 * Increments hop_count and propagates correlation_id.
 */
export function createChildLineage(
  parent: OrchestrationEvent,
  newEventId: string
): LineageContext {
  return {
    correlation_id: parent.correlation_id || parent.event_id,
    root_event_id: parent.correlation_id ? parent.event_id : undefined,
    parent_event_id: parent.event_id,
    hop_count: parent.hop_count + 1,
  };
}

/**
 * Create a child event from a parent event.
 * Preserves lineage: correlation_id, root_event_id, parent_event_id, hop_count.
 */
export function createChildEvent(
  parent: OrchestrationEvent,
  eventType: string,
  source: string,
  payload: object
): OrchestrationEvent {
  const { createEvent } = require('./event-schemas');
  
  const lineage = createChildLineage(parent, parent.event_id);
  
  const child = createEvent(eventType, source, payload, {
    correlation_id: lineage.correlation_id,
    hop_count: lineage.hop_count + 1, // +1 for the new event
  });

  // Attach lineage metadata to payload for tracing
  (child as any)._lineage = {
    root_event_id: lineage.root_event_id,
    parent_event_id: lineage.parent_event_id,
    chain_depth: lineage.hop_count,
  };

  return child;
}

/**
 * Check if an event has exceeded the maximum hop count.
 * Events that exceed max hops should be stopped to prevent infinite loops.
 */
export function isHopCountExceeded(event: OrchestrationEvent, maxHops: number): boolean {
  return event.hop_count >= maxHops;
}

/**
 * Validate event chain integrity.
 * Returns errors if the chain is broken or suspicious.
 */
export function validateLineage(event: OrchestrationEvent): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!event.event_id) {
    errors.push('event_id is required');
  }

  if (!event.event_type) {
    errors.push('event_type is required');
  }

  if (!event.source) {
    errors.push('source is required');
  }

  // Hop count validation
  if (event.hop_count < 0) {
    errors.push(`hop_count cannot be negative: ${event.hop_count}`);
  }

  if (event.hop_count > 100) {
    warnings.push(`hop_count is very high (${event.hop_count}) — possible loop`);
  }

  // Correlation ID validation
  if (event.correlation_id && event.correlation_id.length > 128) {
    errors.push('correlation_id exceeds maximum length of 128 characters');
  }

  // If correlation_id is not set, this is a root event
  // That's okay, but we should note it
  if (!event.correlation_id) {
    warnings.push('Event has no correlation_id — cannot be linked to a chain');
  }

  // Timestamps
  if (!event.created_at) {
    errors.push('created_at is required');
  } else {
    const createdDate = new Date(event.created_at);
    if (isNaN(createdDate.getTime())) {
      errors.push('created_at is not a valid ISO8601 timestamp');
    } else {
      // Event created in the future is suspicious
      const now = Date.now();
      const createdMs = createdDate.getTime();
      if (createdMs > now + 60000) {
        warnings.push('created_at is more than 1 minute in the future');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format event lineage as a human-readable string.
 */
export function formatLineage(event: OrchestrationEvent): string {
  const parts = [
    `event_id=${event.event_id}`,
    `type=${event.event_type}`,
    `source=${event.source}`,
  ];

  if (event.correlation_id) {
    parts.push(`correlation_id=${event.correlation_id}`);
  }

  parts.push(`hop_count=${event.hop_count}`);
  parts.push(`created=${event.created_at}`);

  return parts.join(' | ');
}

/**
 * Extract lineage summary from an event for logging.
 */
export function getLineageSummary(event: OrchestrationEvent): {
  event_id: string;
  correlation_id: string | null;
  hop_count: number;
  chain_position: 'root' | 'intermediate' | 'deep';
} {
  return {
    event_id: event.event_id,
    correlation_id: event.correlation_id || null,
    hop_count: event.hop_count,
    chain_position: event.hop_count === 0 ? 'root' : event.hop_count < 5 ? 'intermediate' : 'deep',
  };
}

/**
 * Build an event chain summary from multiple events.
 * Useful for debugging complex event flows.
 */
export function buildEventChainSummary(events: OrchestrationEvent[]): {
  root_event_id: string | null;
  chain_length: number;
  max_hop_count: number;
  event_types: string[];
  correlation_ids: string[];
  has_loops: boolean;
} {
  const correlationIds = new Set<string>();
  const eventTypes = new Set<string>();
  let maxHopCount = 0;

  for (const event of events) {
    if (event.correlation_id) {
      correlationIds.add(event.correlation_id);
    }
    eventTypes.add(event.event_type);
    if (event.hop_count > maxHopCount) {
      maxHopCount = event.hop_count;
    }
  }

  // A loop is suspected if hop_count grows without new correlation_ids
  const has_loops = events.length > correlationIds.size * 2;

  // Find root (event with hop_count=0 and no parent reference)
  const roots = events.filter(e => e.hop_count === 0);
  const root_event_id = roots.length > 0 ? roots[0].event_id : null;

  return {
    root_event_id,
    chain_length: events.length,
    max_hop_count: maxHopCount,
    event_types: Array.from(eventTypes),
    correlation_ids: Array.from(correlationIds),
    has_loops,
  };
}

/**
 * Log lineage information for an event.
 */
export function logLineage(event: OrchestrationEvent, context: string = ''): void {
  const summary = getLineageSummary(event);
  console.log(
    `[lineage][${context}] ${summary.event_id} ` +
    `(hop=${summary.hop_count}, position=${summary.chain_position})` +
    (summary.correlation_id ? ` [corr=${summary.correlation_id}]` : '')
  );
}