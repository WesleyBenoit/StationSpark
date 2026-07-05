# Contributing to StationSpark

Thanks for helping build StationSpark. This guide covers how to get set up, the
quality bar for changes, and the safety rules that are non-negotiable for this
product.

## Getting started

```bash
npm install
cp .env.example .env   # fill in Supabase and optional keys
npm run start
```

See `README.md` for the full environment and Supabase setup.

## Quality gates

Every pull request must pass the same checks CI runs. Run them locally before
pushing:

```bash
npm run typecheck
npm run lint
npm run test:coverage
```

- **Type safety**: the project is `strict`. Do not introduce `any` or
  non-null assertions to silence the compiler — fix the type.
- **Tests**: add or update tests for product rules and pure logic. New modules
  under `src/lib` are expected to ship with unit tests.
- **Lint**: no new warnings.

## Branch and commit conventions

- Branch from the latest `main`. Use a descriptive prefix, e.g.
  `feat/`, `fix/`, `chore/`, `docs/`.
- Write imperative, scoped commit messages ("Add invite expiry sweep", not
  "changes").
- Keep pull requests focused. Large, unrelated changes are hard to review and
  risk the safety guarantees below.

## Architecture conventions

- **Functions over classes** for services and helpers; match the surrounding
  style.
- **Validation** lives in `src/lib/validation.ts` (Zod). Validate at the
  boundary; keep screens and stores working with typed data.
- **Logging** goes through `src/lib/logger`, never raw `console.*`.
- **Error reporting** goes through `src/lib/errorReporting.captureException`.
- **Network calls** that can fail transiently should use
  `src/lib/retry.withRetry`.
- **Policy helpers** (`src/lib/policies.ts`) encode the safety rules and are
  covered by `tests/policies.test.ts`. Changing them requires updating tests.

## Safety rules (must not regress)

StationSpark is a safety-first product. These boundaries are enforced in both
the app and the database and must never be weakened without explicit product
and security review:

- Users must confirm they are 18+ before using the app.
- Adult Mode is off by default, opt-in, consent-gated, and only visible when
  both users have enabled it.
- Public profile and station-presence fields never expose exact GPS location,
  parking spot, or license plate, and reject explicit content.
- Chat requires an accepted, unexpired invite between unblocked users.
- Blocks are bidirectional and remove mutual visibility and interaction.

If a change touches any of the above, call it out explicitly in the PR
description and ensure `tests/policies.test.ts` still passes.

## Security

Never commit secrets. Report vulnerabilities privately per `SECURITY.md` rather
than opening a public issue.
