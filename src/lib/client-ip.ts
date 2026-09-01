export function getClientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null;
  }

  return headers.get('x-real-ip');
}

export function getClientIp(req: Request): string | null {
  return getClientIpFromHeaders(req.headers);
}
