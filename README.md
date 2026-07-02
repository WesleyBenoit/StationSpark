# StationSpark

StationSpark is a mobile-first social discovery app for Tesla and EV drivers at charging stations.

Positioning: StationSpark helps EV drivers connect socially, professionally, and safely while charging. It is not positioned as a sexual app. Adult Mode is private, opt-in, age-gated, consent-based, and hidden unless both users enabled it.

## Stack

- React Native with Expo and TypeScript
- Supabase Auth, Postgres, Realtime-ready tables, Storage-ready profile photo fields
- PostgreSQL Row Level Security and RPC functions
- NativeWind for styling
- Zustand for app state
- React Hook Form and Zod validation
- Expo Location and Expo Notifications
- Mapbox-first map wrapper with Google/react-native-maps fallback
- Vitest unit tests for critical product rules
- Stripe-ready subscription placeholders

## Project Structure

```text
src/
  components/       Reusable UI components
  constants/        Theme, options, pricing placeholders
  lib/              Supabase client, validation, shared policy helpers
  navigation/       Auth, onboarding, tabs, and app stack
  screens/          Core MVP screens
  services/         Supabase service layer
  stores/           Zustand stores
  types/            Domain types
supabase/
  schema.sql        Tables, constraints, RLS, views, RPCs, triggers
  seed.sql          Demo charging stations
tests/
  policies.test.ts  Invite, chat, adult mode, and blocking tests
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Fill in:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

4. Apply Supabase SQL in the SQL editor or through the Supabase CLI:

```bash
supabase db push
```

Then run `supabase/seed.sql` to add demo charging stations.

5. Start the app:

```bash
npm run start
```

6. Run checks:

```bash
npm run typecheck
npm run test
```

## Supabase Notes

`supabase/schema.sql` implements:

- Required tables from the MVP spec
- RLS for users, profiles, stations, check-ins, arrival intents, invites, chats, messages, blocks, reports, ratings, and subscriptions
- `station_presence_public` and `arrival_intents_public` views that hide raw Adult Mode flags and remove adult interests unless both users opted in
- `send_invite` RPC with adult-mode, age, ban, and block checks
- `accept_invite` RPC that creates a chat only after acceptance
- Message insert policy requiring an accepted invite and unblocked participants
- Public profile explicit-content validation
- `profile-photos` storage bucket and owner-scoped upload/update/delete policies
- `expire_invites()` for scheduled expiration

Schedule invite expiration in Supabase cron:

```sql
select public.expire_invites();
```

Run it every minute for production behavior.

## MVP Coverage

Phase 1 implemented:

- Auth screens with email/password and OAuth/phone placeholders
- 18+ and terms gates
- Onboarding and profile editing
- Charging station list and map wrapper
- Manual check-in and checkout
- On-the-way status
- Station detail and station-level user cards
- Invite composer and invite inbox
- Accepted invite opens chat
- Block and report flows
- Adult Mode gating
- Safety Center and basic settings

Phase 2 placeholders included:

- Push notifications
- Ratings table
- Trusted contact
- Premium tier and Stripe checkout
- Verification badges

Phase 3 intentionally not implemented:

- Tesla API integration
- Automatic station detection
- Charging session detection
- Partner offers
- In-car entertainment integrations

## Safety Rules

The app and database enforce these boundaries:

- Users must confirm they are 18+ before using the app.
- Adult Mode is off by default.
- Adult interests and adult invite capability are visible only when both users enabled Adult Mode.
- Public profile fields reject explicit adult terms.
- Public station presence never stores or shows exact GPS location, parking spot, or license plate.
- Invites expire after 10 minutes by default.
- Chat messages require an accepted invite.
- Blocks hide both users from each other and prevent interaction.
- Reports are saved while reported users remain usable unless banned.
- Users can check out, hide, or use Ghost Mode.

## Mapbox

If `EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN` is present, `MapViewWrapper` uses `@rnmapbox/maps`. Otherwise it falls back to `react-native-maps`. Mapbox requires an Expo development build or native build configuration; Expo Go may not support it.

## App Store Language

Use:

> StationSpark helps EV drivers connect socially, professionally, and safely while charging.

Adult Mode wording:

> Private opt-in adult social preferences for verified adults.

Do not market StationSpark as a hookup app.
