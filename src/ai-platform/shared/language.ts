export function isLikelyEnglish(text: string): boolean {
  const arabic = text.match(/[\u0600-\u06FF]/g)?.length ?? 0;
  const latin = text.match(/[a-zA-Z]/g)?.length ?? 0;

  if (arabic > 0 && /[\u0600-\u06FF]{2,}/.test(text)) {
    return false;
  }

  return latin > arabic;
}
