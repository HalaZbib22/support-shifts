# Support Shifts

Shift registration for a dev team's out-of-hours support rota. Next.js 15 (App Router) + MUI + Firebase (Google sign-in, Firestore). UI implements the *Industry* design system: steel-blue wireframe on a light technical ground, Barlow Condensed over Barlow, square corners and blueprint registration marks.

![screens: board, shift drawer, swaps, admin, payouts]

## What it does

**The week board** — seven day columns, three time rows, a heavy top rule; reads as a wall calendar rather than a data grid. Weekday daytime is one pale "office hours" band, not empty cells. Seat tokens follow a strict grammar so the board is scannable at a glance:

| Token | Meaning |
|---|---|
| Dashed role outline, tinted, "+ Claim seat" | Open **and** it's your role — the only call to action on the board |
| Solid role fill, "You" | Yours. Nothing else on the board is filled |
| Faint role tint, plain name | Someone else holds it. Quiet |
| Grey dashed "Open" | Open, but not your role. Visible, not inviting |

Past days dim, today gets an accent rule and a "Today" mark. A fairness strip above the grid shows each person's shift count for the month, so nobody quietly ends up with five weekends.

**Shift detail** — a right-hand drawer (bottom sheet on phones) with the three seats and their one legal action each, the handover note left by the previous shift, and the note you leave for the next. Claiming shows how the choice affects your monthly count against the team median.

**Swaps** — same-role only, so every request is a straight trade of two seats. Incoming requests get Accept / Decline; outgoing show where they are, with Cancel. Accepting moves both seats in one Firestore transaction.

**Admin** — roster with a role toggle and admin switch per person; weeks move Draft → Published → Locked, each with the counts that matter at that stage.

**Payouts** — one row per person, one column per month, $20 per shift. Only locked weeks count; seats in published-but-unlocked weeks show as "pending". CSV export. Non-admins see only their own row.

**Calendar** — each person gets a private subscription URL (account menu → Add shifts to calendar). Subscribe once in Google Calendar and the shifts you hold appear automatically, with the other two seat-holders and their roles in the event description, and a 30-minute reminder. Swaps and releases flow through on Google's next refresh. There's also a one-click "Add to calendar" for a single shift in the drawer, and a **Your next shifts** panel on the board showing who you're paired with.

**Board states** — empty, loading (skeleton) and error all keep the calendar frame so the page never jumps. On a connection error the last good copy stays on screen and claims pause.

Mobile: the board becomes one day at a time with a seven-day tab strip (dots mark your seats and seats open to you), and the nav moves to a bottom bar.

## Setup

### 1. Firebase

1. console.firebase.google.com → **Add project**.
2. **Build → Authentication → Sign-in method → Google → Enable**.
3. **Build → Firestore Database → Create database** → Standard edition → production mode → a region near your team.
4. **Project settings → Your apps → Web (`</>`)** → register → copy the `firebaseConfig` values.
5. `cp .env.local.example .env.local` and fill in the six `NEXT_PUBLIC_FIREBASE_*` values. (`measurementId` isn't used.)
6. Deploy the rules — production mode blocks every write until you do, including the profile your first sign-in creates:

```bash
npm i -g firebase-tools
firebase login
firebase use --add          # pick the project
firebase deploy --only firestore:rules
```

### 2. Run

```bash
npm install
npm run dev
```

### 3. Make yourself admin

The rules deliberately don't let anyone grant themselves admin, so the first one is set by hand: Firestore console → `users` → your document → `isAdmin` = `true`. Refresh; the **Admin** tab appears. Everyone else's roles and admin flags are set from there.

### 4. Calendar feed (optional)

The `.ics` route runs server-side, where there's no user session, so it needs the Firebase Admin SDK. Firebase console → Project settings → **Service accounts** → Generate new private key. From the downloaded JSON, set three more variables (these are real secrets — never prefix them with `NEXT_PUBLIC_`):

```
FIREBASE_ADMIN_PROJECT_ID=<project_id>
FIREBASE_ADMIN_CLIENT_EMAIL=<client_email>
FIREBASE_ADMIN_PRIVATE_KEY=<private_key, newlines as \n>
NEXT_PUBLIC_APP_URL=https://<your-domain>
```

Without these the app works fine; the feed URL just returns 503.

To limit sign-in to one Google Workspace domain, also set `NEXT_PUBLIC_ALLOWED_DOMAIN=yourcompany.com`. That filters the Google account picker — for real enforcement, add an email check to the `users` create rule.

### 5. Deploy to Vercel

```bash
npm i -g vercel
vercel            # link the project
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY        # repeat for all six
vercel --prod
```

Set `NEXT_PUBLIC_APP_URL` to the live URL so the calendar links point at production rather than localhost.

Then in Firebase → Authentication → Settings → **Authorized domains**, add your `*.vercel.app` domain (and any custom domain), or Google sign-in will be rejected in production.

The `NEXT_PUBLIC_*` values are public by design — Firebase security lives in the rules, not the key. `.env.local` is gitignored anyway.

## A typical week

1. Admin creates the week (11 shifts, draft).
2. Admin publishes it.
3. Devs claim seats for their role; they can release or request a swap while it's open.
4. Seat-holders leave handover notes as shifts finish.
5. Admin locks the week; it becomes payable and appears in Payouts.

## Data model

| Collection | Doc id | Fields |
|---|---|---|
| `users` | uid | displayName, email, photoURL, role (`fe`/`mobile`/`be_l1`/`be_l2`/null), isAdmin |
| `weeks` | `2026-W37` | status (`draft`/`open`/`locked`), startDate |
| `shifts` | `2026-W37_sat_morning` | weekId, date, day, slot, start, end, seats{fe,mobile,be_l1}, handover?, swapId? |
| `swaps` | auto | role, fromUid, toUid, giveShiftId, takeShiftId, status, createdAt, resolvedAt |

`users.calendarToken` is an unguessable id that appears in that person's feed URL; calendar apps can't sign in, so the token is what identifies them. Resetting it from the dialog invalidates the old link immediately.

The shift template lives in `src/lib/template.ts`: weekday evenings 18–23, weekends 8–13 / 13–18 / 18–23 — 11 shifts, 33 seats a week.

### Rules enforce all of it server-side

Claiming and releasing is limited to your own role's seat in a published week; swap-driven seat moves are verified against the pending swap document and its two named parties; handover notes can only be written by one of the three seat-holders; nobody can grant themselves a role or admin. Concurrent claims are resolved by a Firestore transaction, so two people tapping the same seat can't both get it.

## Project layout

```
src/
  app/            board (/), swaps, admin, payouts, api/calendar/[token]
  components/     AppShell, Blueprint frame, Tag, Toast, board/*
  lib/            firebase, types, template, board model, shifts, swaps, hooks/
firestore.rules   the server-side half of every rule above
```
