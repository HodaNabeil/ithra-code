export interface ResponseProcessorContext {
  question?: string;
  retrievedSources?: Array<{
    content: string;
    metadata: Record<string, unknown>;
  }>;
  scope?: Record<string, string | undefined>;
  metadata?: Record<string, unknown>;
}

export type ResponseProcessorDisposition =
  | 'unchanged'
  | 'replaced'
  | 'rejected';

export interface ResponseProcessorResult {
  output: string;
  disposition: ResponseProcessorDisposition;
  signals?: Record<string, unknown>;
}

/**
 * Post-generation response processing injected by a feature layer.
 * May validate, transform, or replace model output.
 */
export interface ResponseProcessorPort {
  process(
    response: string,
    context: ResponseProcessorContext,
  ): Promise<ResponseProcessorResult>;
}
