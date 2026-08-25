import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    aiAgentRun: {
      create: mockCreate,
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

const mockIsEnabled = vi.fn(() => true);

vi.mock('@/ai-platform/infrastructure/config/ai-platform.config', () => ({
  AIPlatformConfig: {
    isEnabled: mockIsEnabled,
    getEmbeddingConfig: () => ({ model: 'text-embedding-3-small' }),
  },
}));

describe('cost-ledger.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsEnabled.mockReturnValue(true);
  });

  it('prices completion using actualModel when fallback served', async () => {
    mockFindUnique.mockResolvedValue({
      model: 'gpt-4o-mini',
      provider: 'openai',
    });
    mockUpdate.mockResolvedValue({});

    const { completeAgentRun } =
      await import('@/ai-platform/observability/cost/cost-ledger.service');

    await completeAgentRun({
      runId: 'run-1',
      inputTokens: 1_000_000,
      outputTokens: 0,
      tokenUsageEstimated: false,
      actualModel: 'gpt-4o',
      actualProvider: 'openai',
      latencyMs: 120,
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'run-1' },
      data: expect.objectContaining({
        actualModel: 'gpt-4o',
        actualProvider: 'openai',
        tokenUsageEstimated: false,
        estimatedCostUsd: 2.5,
      }),
    });
  });

  it('persists tokenUsageEstimated flag', async () => {
    mockFindUnique.mockResolvedValue({
      model: 'gpt-4o-mini',
      provider: 'openai',
    });
    mockUpdate.mockResolvedValue({});

    const { completeAgentRun } =
      await import('@/ai-platform/observability/cost/cost-ledger.service');

    await completeAgentRun({
      runId: 'run-2',
      inputTokens: 100,
      outputTokens: 50,
      tokenUsageEstimated: true,
      actualModel: 'gpt-4o-mini',
      actualProvider: 'openai',
      latencyMs: 80,
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'run-2' },
      data: expect.objectContaining({
        tokenUsageEstimated: true,
      }),
    });
  });

  it('skips ledger writes when platform is disabled', async () => {
    mockIsEnabled.mockReturnValueOnce(false);

    const { completeAgentRun } =
      await import('@/ai-platform/observability/cost/cost-ledger.service');

    await completeAgentRun({
      runId: 'run-3',
      inputTokens: 10,
      outputTokens: 5,
      latencyMs: 10,
    });

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
