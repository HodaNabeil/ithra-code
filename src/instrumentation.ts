export async function register() {
  // Startup hooks use Node-only APIs (Prisma, Redis, OTEL).
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

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

    await validatePlatformInfrastructure();
  }

  if (process.env.AI_TUTOR_ENABLED === 'true') {
    const { validateAITutorConfig } = await import(
      '@/features/ai-tutor/infrastructure/config/ai-tutor.config'
    );

    validateAITutorConfig();
  }
}
