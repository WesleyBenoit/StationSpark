# Security Policy

StationSpark handles location data, private messages, and Adult Mode preferences for
EV drivers. We take reports of security or privacy issues seriously.

## Reporting a Vulnerability

Please do not open a public GitHub issue for security vulnerabilities. Instead, email
the maintainers with:

- A description of the issue and its potential impact
- Steps to reproduce, including any proof-of-concept code
- The affected version or commit

We aim to acknowledge reports within 3 business days and to provide a remediation
timeline once the issue is confirmed.

## Scope

In scope:

- Row Level Security (RLS) bypasses in `supabase/schema.sql`
- Authentication or session handling flaws
- Leakage of exact GPS location, license plates, or Adult Mode status to
  unauthorized users
- Bypass of block, report, or age-gating logic
- Injection or XSS vectors in client or database code

Out of scope:

- Findings that require physical access to a user's unlocked device
- Denial-of-service reports against third-party infrastructure (Supabase, Mapbox,
  Stripe, Expo/EAS)

## Supported Versions

Only the `main` branch and the most recent release receive security fixes.
