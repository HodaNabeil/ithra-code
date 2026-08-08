export interface ResponseEnricherContext {
  question?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Additive post-validation enrichment (append-only; must not replace content).
 */
export interface ResponseEnricherPort {
  enrich(response: string, context: ResponseEnricherContext): Promise<string>;
}
