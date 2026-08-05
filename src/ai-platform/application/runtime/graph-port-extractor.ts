import type { ResponseProcessorPort } from '../../domain/ports/response-processor.port';
import type { ResponseEnricherPort } from '../../domain/ports/response-enricher.port';
import type { EducationalContentValidatorPort } from '../../graph/runtime-config';

function isResponseProcessor(value: unknown): value is ResponseProcessorPort {
  return (
    typeof value === 'object' &&
    value !== null &&
    'process' in value &&
    typeof (value as ResponseProcessorPort).process === 'function'
  );
}

function isResponseEnricher(value: unknown): value is ResponseEnricherPort {
  return (
    typeof value === 'object' &&
    value !== null &&
    'enrich' in value &&
    typeof (value as ResponseEnricherPort).enrich === 'function'
  );
}

function isLegacyContentValidator(
  value: unknown,
): value is EducationalContentValidatorPort {
  return (
    typeof value === 'object' &&
    value !== null &&
    'validateResponse' in value &&
    typeof (value as EducationalContentValidatorPort).validateResponse === 'function'
  );
}

function wrapLegacyContentValidator(
  validator: EducationalContentValidatorPort,
): ResponseProcessorPort {
  return {
    async process(response, context) {
      const validation = await validator.validateResponse(
        response,
        {
          question: context.question,
          retrievedSources: context.retrievedSources,
          courseId: context.scope?.courseId,
          lectureId: context.scope?.lectureId,
        },
        {
          courseId: context.scope?.courseId,
          lectureId: context.scope?.lectureId,
        },
      );

      if (validation.isValid) {
        return { output: response, disposition: 'unchanged' };
      }

      return {
        output: validation.suggestedResponse ?? response,
        disposition: 'replaced',
        signals: { filterTriggered: true },
      };
    },
  };
}

export function extractGraphInjectionPorts(
  metadata: Record<string, unknown> | undefined,
): {
  responseProcessor?: ResponseProcessorPort;
  responseEnricher?: ResponseEnricherPort;
  enrichmentContext?: Record<string, unknown>;
  contentValidator?: EducationalContentValidatorPort;
} {
  if (!metadata) {
    return {};
  }

  const responseProcessor = isResponseProcessor(metadata.responseProcessor)
    ? metadata.responseProcessor
    : isLegacyContentValidator(metadata.contentValidator)
      ? wrapLegacyContentValidator(metadata.contentValidator)
      : undefined;

  const responseEnricher = isResponseEnricher(metadata.responseEnricher)
    ? metadata.responseEnricher
    : undefined;

  const enrichmentContext =
    metadata.enrichmentContext &&
    typeof metadata.enrichmentContext === 'object' &&
    metadata.enrichmentContext !== null
      ? (metadata.enrichmentContext as Record<string, unknown>)
      : undefined;

  const contentValidator = isLegacyContentValidator(metadata.contentValidator)
    ? metadata.contentValidator
    : undefined;

  return {
    responseProcessor,
    responseEnricher,
    enrichmentContext,
    contentValidator,
  };
}

export function extractRunMetadata(
  state: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  if (!state) {
    return undefined;
  }

  const metadata: Record<string, unknown> = {};

  if ('runSignals' in state && typeof state.runSignals === 'object' && state.runSignals) {
    Object.assign(metadata, state.runSignals as Record<string, unknown>);
  }

  if ('assessmentBlocked' in state && state.assessmentBlocked === true) {
    metadata.assessmentBlocked = true;
  }

  if (
    'validationErrors' in state &&
    Array.isArray(state.validationErrors) &&
    state.validationErrors.includes('content_filter')
  ) {
    metadata.filterTriggered = true;
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}
