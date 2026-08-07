export async function register() {
  if (process.env.OTEL_ENABLED === 'true') {
    const { initOtel } = await import(
      '@/ai-platform/observability/opentelemetry/otel-setup'
    );
    initOtel();
  }

  if (process.env.AI_PLATFORM_ENABLED === 'true') {
    const { validatePlatformInfrastructure } = await import(
      '@/ai-platform/infrastructure/startup/validate-platform-infrastructure'
    );

    try {
      await validatePlatformInfrastructure();
    } catch (error) {
      console.error(
        '[AI_PLATFORM_STARTUP] Platform infrastructure validation failed:',
        error,
      );
      process.exit(1);
    }
  }
}
