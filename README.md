# TVK Nandhivaram Guduvancheri Municipality

Party app for **Nandhivaram Guduvancheri Municipality** — the ward roster, the events
the party runs, and the grievances residents bring. English and Tamil, built phone-first,
installable as an app.

One Next.js application: the pages and the server logic live together and deploy as a
single unit. Data is in Postgres (Neon). There is no separate backend service.

## What it does

- **Wards 1–30**, each showing its member count, leadership, events and petitions
- **Members** — name, ward, role, gender, and optionally phone, address, voter ID, photo
- **Events** — for one ward or the whole party, with a banner and a photo gallery
- **Petitions** — resident grievances for one ward or the whole town, tracked from
  submitted through to resolved, with evidence photos
- **Roles** an admin defines, with a per-ward limit on each
- Sign in with a username and password
- Installable progressive web app, English and Tamil

**Not built yet:** logins for members themselves. Members are records here, not
accounts — every change goes through an admin.

## Requirements

- Node.js 22 or newer (`node --version`)
- A Neon Postgres database — the free tier is enough

## Setup

```bash
npm install
```

Create `.env.local`:

```bash
cp .env.example .env.local
```

Fill in both values:

| Variable | Where it comes from |
| --- | --- |
| `DATABASE_URL` | Neon dashboard → your project → Connection Details → **pooled** connection string |
| `SESSION_SECRET` | Generate one (below). At least 32 characters |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob. Needed for photos; without it, development writes to `public/uploads` |

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

In production the app refuses to issue or accept sessions without a real
`SESSION_SECRET` — a guessable one would let anyone forge an admin session.

Create the tables, seed the wards and roles, then make yourself an admin:

```bash
npm run db:migrate      # creates the tables
npm run db:seed         # wards 1-30 and the default roles
npm run create-admin -- yourname
```

`create-admin` prompts for the password without echoing it, so it never reaches your
shell history.

## Run

```bash
npm run dev     # http://localhost:3000
```

For production:

```bash
npm run build
npm run start
```

Installing to a home screen needs HTTPS, so the install prompt appears on a deployed
site, not on `localhost`. To test it locally, run `npx next dev --experimental-https`.

## Deploying to Vercel

1. Push the repository and import it in Vercel.
2. Set `DATABASE_URL` and `SESSION_SECRET` as environment variables.
3. Deploy.

Run `npm run db:migrate` against the production database whenever the schema changes —
it is not run automatically on deploy, so a migration never surprises you mid-release.

## Roles

Roles are data, not code. Three are seeded:

| Role | Limit per ward |
| --- | --- |
| Organiser | 1 |
| Associate Organiser | unlimited |
| Member | unlimited |

An admin can rename any of them and add new ones under **Settings → Roles**, setting
each one's per-ward limit. The three seeded roles can be renamed but not deleted, and a
role that members still hold cannot be deleted at all.

Roles carry **no permissions**. Who may change data is decided by the `is_admin` flag on
an account, so adding a role can never accidentally hand out write access.

## Changing the database

Edit `src/db/schema.ts`, then:

```bash
npm run db:generate     # writes a new SQL file into drizzle/
npm run db:migrate      # applies it
```

The generated SQL is committed, so every environment applies the same statements.
`npm run db:studio` opens a browser UI over the data.

## Photos

Photos live in Vercel Blob, because a serverless filesystem does not survive the
request that wrote to it. Create a store under **Storage → Blob** in the Vercel
dashboard; it sets `BLOB_READ_WRITE_TOKEN` for the project.

**Then redeploy.** Vercel injects environment variables at build time, so a
deployment built before the store existed will not see the token and photo upload
will keep failing until it is rebuilt.

Without that token, development writes to `public/uploads` instead. Production
refuses that path and returns an error rather than writing somewhere that vanishes.

Photos uploaded locally are recorded with `/uploads/...` URLs that a deployment
cannot serve. To move them across once the token is in `.env.local`:

```bash
npm run migrate-photos
```

It uploads each file, rewrites the row, and skips anything already in blob storage.

## Locked out?

There is no email reset, because the app stores no email addresses. Re-run:

```bash
npm run create-admin -- yourname
```

on an existing username and it sets a new password. This needs `DATABASE_URL`, so treat
access to that connection string as equivalent to admin access.

## Project layout

```
drizzle/                 Generated SQL migrations (committed)
scripts/                 Seed and admin bootstrap, run with node directly
src/
  app/[locale]/          Pages. (app) holds the signed-in screens
  components/            UI, grouped by feature
  db/                    Drizzle schema and the Neon connection
  server/
    queries.ts           Reads, used by server components
    *-actions.ts         Writes, called from client components
  lib/auth/              Sessions, passwords, throttling, permission guards
  i18n/dictionaries/     en.ts is the source of truth; ta.ts is typed against it
  proxy.ts               Sign-in gate (Next.js 16 renamed middleware to proxy)
```

A new UI string goes in **both** `en.ts` and `ta.ts` — Tamil is typed against English,
so a missing key fails the build.
