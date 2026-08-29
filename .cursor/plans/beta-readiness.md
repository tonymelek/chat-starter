# Beta Readiness Plan

Goal: friends can use **Chat Starter** via **web URL** or **TestFlight** before any public App Store release.

---

## Documentation map

| Document | Audience | Purpose |
|----------|----------|---------|
| [`docs/SETUP.md`](../../docs/SETUP.md) | **You** | Firebase Console, deploy, Apple — checklist |
| [`docs/SCHEMA.md`](../../docs/SCHEMA.md) | You + AI | Firestore/Storage data model |
| This file | AI + you | What to build vs what you configure |
| [`.cursor/rules/`](../rules/) | AI | Coding conventions |

---

## Execution order

```
Phase 1: YOU  → Firebase Console (auth, index, rules)
Phase 2: AI   → Repo basics (env, sync, errors, rules files)
Phase 3: YOU  → Verify locally with 2 test accounts
Phase 4: AI   → Hosting + TestFlight config files
Phase 5: YOU  → Deploy web and/or TestFlight
Phase 6: AI   → Nice-to-have UX (optional)
```

---

# Part A — Basics (required)

## A1. YOU — Firebase Console

| # | Task | Doc |
|---|------|-----|
| 1 | Enable Email/Password auth | [`SETUP.md`](../../docs/SETUP.md) |
| 2 | Create Firestore composite index (`chatRooms`: participants + updatedAt) | [`firebase/firestore.indexes.json`](../../firebase/firestore.indexes.json) |
| 3 | Publish Firestore rules | [`firebase/firestore.rules`](../../firebase/firestore.rules) |
| 4 | Publish Storage rules | [`firebase/storage.rules`](../../firebase/storage.rules) |
| 5 | Add web hosting URL to Auth authorized domains (after deploy) | SETUP.md § Web deploy |

**Status:** [ ] Not started

---

## A2. AI — Repo (basics)

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Firebase config via `EXPO_PUBLIC_*` env vars | `lib/firebase.ts`, `.env.example` | [x] |
| 2 | Sync `displayName` (+ `photoURL`) to `users/{uid}` on profile update | `app/profile/index.tsx` | [x] |
| 3 | Sync `displayName` on login/signup (already partial) | `app/login.tsx`, `lib/users.ts` | [x] |
| 4 | Show display name in Contacts (fallback email) | `app/(tabs)/explore.tsx` | [x] |
| 5 | Password reset flow | `app/login.tsx` | [x] |
| 6 | User-friendly Firebase error messages | login, index, explore, chat | [x] |
| 7 | Rules files in repo (mirror Console) | `firebase/*.rules` | [x] |
| 8 | Schema documentation | `docs/SCHEMA.md` | [x] |
| 9 | Setup checklist | `docs/SETUP.md` | [x] |
| 10 | Cursor rules + this plan | `.cursor/` | [x] |
| 11 | README index | `README.md` | [x] |

---

## A3. Web distribution

### YOU

| # | Task | Status |
|---|------|--------|
| 1 | Enable Firebase Hosting in Console | [ ] |
| 2 | `firebase login` + `firebase deploy --only hosting` | [ ] |
| 3 | Add Hosting URL to authorized domains | [ ] |

### AI

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | `firebase.json` + `.firebaserc` | project root | [x] |
| 2 | `deploy:web` npm script | `package.json` | [x] |
| 3 | Deploy instructions in README | `README.md` | [x] |

---

## A4. TestFlight (iOS)

### YOU

| # | Task | Status |
|---|------|--------|
| 1 | Apple Developer Program | [ ] |
| 2 | App Store Connect app entry | [ ] |
| 3 | `eas login` + build + submit | [ ] |
| 4 | Invite testers in TestFlight | [ ] |

### AI

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | `ios.bundleIdentifier` in app config | `app.json` | [x] |
| 2 | EAS build profiles | `eas.json` | [x] |
| 3 | TestFlight docs in README | `README.md` | [x] |

---

# Part B — Nice-to-have (after basics work)

## B1. YOU — Firebase Console

| # | Task |
|---|------|
| 1 | Separate dev Firebase project |
| 2 | Firebase App Check |
| 3 | Billing alerts |
| 4 | Custom auth email templates |

## B2. AI — Repo

| # | Task | Files |
|---|------|-------|
| 1 | Editable `bio` in Firestore | `app/profile/index.tsx`, schema |
| 2 | Avatars + names in chat bubbles / room list | chat, index screens |
| 3 | Default room name from other participant | explore, chat |
| 4 | Loading / empty / error states everywhere | all screens |
| 5 | Hide or label placeholder Settings rows | `app/(tabs)/settings.tsx` |
| 6 | Input validation (email, password length) | `app/login.tsx` |
| 7 | `firebase deploy` scripts for rules | `package.json`, `firebase.json` |

## B3. Later (not beta-critical)

| Owner | Task |
|--------|------|
| AI | Push notifications |
| AI | Image messages |
| AI | Group chats |
| YOU | Custom domain for hosting |
| YOU | Public App Store release |

---

## Definition of done (beta)

- [ ] Two test users can sign up, find each other in Contacts, and chat in real time
- [ ] Home screen loads without index errors
- [ ] Avatar upload works
- [ ] Web URL **or** TestFlight build shared with at least one friend
- [ ] Firestore + Storage rules published (not open/test mode)
