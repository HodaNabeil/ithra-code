# Secrets Rotation & Secrets Manager Runbook

This document tracks the secret rotation required after `.env` was accidentally committed to Git. Every secret that appeared in the committed file must be considered compromised and rotated.

## Immediate status

- `.env` has been removed from Git tracking (`git rm --cached .env`).
- `.env` remains in `.gitignore` and must stay local-only.
- `.env.example` is the only `.env`-like file that should be committed.

## Secrets that must be rotated

| Secret | Service | Where to rotate | Action |
|--------|---------|-----------------|--------|
| `DATABASE_URL` password | Neon PostgreSQL | Neon Dashboard → Connection string → Reset password | Generate new password, update `DATABASE_URL` and `DIRECT_URL` |
| `REDIS_URL` token | Upstash Redis | Upstash Console → Database → Reset password | Copy new `rediss://...` URL |
| `AUTH_SECRET` | NextAuth.js | Generate locally: `openssl rand -hex 32` | Replace value in secrets manager |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 client | Create new credentials or regenerate secret |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth | GitHub Settings → Developer settings → OAuth Apps | Regenerate client secret |
| `STRIPE_API_KEY` | Stripe | Stripe Dashboard → Developers → API keys | Roll test key, update webhooks if needed |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Stripe Dashboard → Webhooks → Endpoint → Reveal/Regenerate | Re-roll webhook endpoint secret |
| `PAYMOB_SECRET_KEY` | Paymob | Paymob Dashboard → Settings → API Keys | Generate new secret key |
| `PAYMOB_PUBLIC_KEY` | Paymob | Paymob Dashboard → Settings → API Keys | Replace if exposed |
| `PAYMOB_HMAC_SECRET` | Paymob | Paymob Dashboard → Webhooks → HMAC Secret | Generate new HMAC secret |
| `PAYMOB_API_KEY` | Paymob | Paymob Dashboard → Developers | Regenerate legacy API key |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | Mux | Mux Dashboard → Settings → Access Tokens | Delete old token, create new token |
| `OPENAI_API_KEY` (OpenRouter) | OpenRouter | OpenRouter Dashboard → Keys | Delete old key, create new key |
| `ANTHROPIC_API_KEY` (if set) | Anthropic | Anthropic Console → API keys | Revoke and recreate |
| `GOOGLE_AI_API_KEY` (if set) | Google AI | Google AI Studio / Cloud Console | Delete and recreate |
| `LANGFUSE_SECRET_KEY` / `LANGFUSE_PUBLIC_KEY` (if set) | Langfuse | Langfuse Project → Settings → API keys | Create new keys |
| `LANGCHAIN_API_KEY` (if set) | LangSmith | LangSmith → Settings → API keys | Create new key |
| `AI_ADMIN_API_SECRET` (if set) | Internal | Generate locally: `openssl rand -hex 32` | Replace in secrets manager |
| `INTERNAL_HEALTH_TOKEN` (if set) | Internal | Generate locally: `openssl rand -hex 32` | Replace in secrets manager |

## Step-by-step rotation procedure

1. **Choose a secrets manager** (see below for Doppler recommendation).
2. **Create a new project/config** in the secrets manager for each environment: `development`, `staging`, `production`.
3. **Rotate every secret above** in the provider's dashboard first. Do not reuse old values.
4. **Store new values in the secrets manager**, not in `.env`.
5. **Update local `.env`** only with non-sensitive dev values (or use `doppler run`).
6. **Update production runtime** (Docker, Kubernetes, Vercel, etc.) to pull from the secrets manager.
7. **Verify** all services still authenticate correctly (database, Redis, OAuth, payments, AI, Mux).
8. **Delete old keys** in provider dashboards after verification.

## Recommended secrets manager: Doppler

[Doppler](https://www.doppler.com) is the recommended secrets manager for this project because it is framework-agnostic, has a Node.js CLI, and works with Next.js without code changes.

### Setup

1. Install the Doppler CLI:
   ```bash
   brew install dopplerhq/cli/doppler
   # or see https://docs.doppler.com/docs/install-cli
   ```

2. Login and create a project:
   ```bash
   doppler login
   doppler projects create ithracode
   ```

3. Create configs for each environment:
   ```bash
   doppler configs create development
   doppler configs create staging
   doppler configs create production
   ```

4. Upload secrets from `.env` (after rotation):
   ```bash
   doppler secrets upload --config development .env
   ```

### Local development

Run the dev server with secrets injected:

```bash
doppler run --config development -- pnpm dev
```

Or for a worker:

```bash
doppler run --config development -- pnpm worker:course-indexing
```

### Production / CI

Use Doppler's GitHub Action or Kubernetes operator to inject secrets at runtime. Do not write secrets to the filesystem.

## Alternative: cloud-native secret stores

If you prefer a cloud provider, use:

- **AWS**: AWS Secrets Manager + Parameter Store. Load via `@aws-sdk/client-secrets-manager` or the AWS Secrets Manager CSI driver on EKS.
- **GCP**: Secret Manager. Mount via the secret volume in Cloud Run or GKE.
- **Azure**: Azure Key Vault. Use the Key Vault SDK or AKS secrets store CSI driver.

If you choose a cloud-native store, add a small loader in `src/config/secrets.ts` that fetches secrets at startup and merges them into `process.env` before `env.ts` validates them. This keeps the rest of the app unchanged.

## Preventing future commits

1. `.env` is already in `.gitignore`. Do not override that.
2. Only commit `.env.example` with placeholder values.
3. Never run `git add -f .env` or `git add --force .env`.
4. Consider adding a pre-commit hook:
   ```bash
   npx husky add .husky/pre-commit "git diff --cached --name-only | grep -E '^\\.env(\\.|$)' && exit 1 || exit 0"
   ```

## Historical note

The `.env` file that was committed contained real credentials. Because it is now in Git history, **rotation is the only fix**. Rewriting Git history is not recommended here because it is destructive and the repo may have been cloned by others. Assume the secrets are known and rotate them.

## Verification checklist

- [ ] `git status` shows `.env` as untracked/deleted from staging, not modified.
- [ ] `.env.example` is committed and contains only placeholders.
- [ ] All provider secrets in the table above have been rotated.
- [ ] New secrets live in the secrets manager, not in any committed file.
- [ ] Local development still works with the new secrets.
- [ ] Production deployment loads secrets from the secrets manager.
- [ ] Old keys are revoked in provider dashboards.
