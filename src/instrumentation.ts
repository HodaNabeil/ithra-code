export async function register() {
  if (process.env.OTEL_ENABLED !== 'true') {
    return;
  }

  const { initOtel } = await import('@/ai-platform/observability/opentelemetry/otel-setup');
  initOtel();
}
