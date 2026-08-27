export interface TurnstileVerifier {
  verify(token: string | undefined, ip: string | null): Promise<void>;
}
