export type AnalyticsDateRange = {
  from: string;
  to: string;
  days: number;
};

export function resolveAnalyticsDateRange(input: {
  days?: string;
  from?: string;
  to?: string;
} = {}): AnalyticsDateRange {
  const now = new Date();

  if (input.from || input.to) {
    return {
      from: input.from ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: input.to ?? now.toISOString(),
      days: 30,
    };
  }

  const parsedDays = Number(input.days ?? 30);
  const days =
    Number.isFinite(parsedDays) && parsedDays > 0
      ? Math.min(Math.floor(parsedDays), 365)
      : 30;
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    from: from.toISOString(),
    to: now.toISOString(),
    days,
  };
}
