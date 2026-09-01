export function computeActualIncrement(
  incrementTime: number,
  currentTimeSpent: number,
  videoDuration: number | null | undefined,
): number {
  if (incrementTime <= 0) return 0;
  if (videoDuration == null || videoDuration <= 0) return incrementTime;
  const cap = Math.ceil(videoDuration * 1.1);
  return Math.min(incrementTime, Math.max(0, cap - currentTimeSpent));
}
