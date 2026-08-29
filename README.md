<p align="center">
  <img src="assets/images/meltek-mark.png" width="96" height="96" alt="Meltek" />
</p>

# Chat Starter

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Expo SDK](https://img.shields.io/badge/Expo-54-000.svg?logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A real-time **1:1 chat starter** for React Native, founded by [Meltek](https://meltek.com.au) — a Melbourne software engineering studio. Built with Expo and Firebase so you can clone, plug in your own project, and have working auth + messaging on iOS, Android, and web.

This is a starting point, not a production messenger. The data model, security rules, and screens are small enough to read in an afternoon and extend from there.

## Features

- Email/password sign up, sign in, and password reset
- Real-time 1:1 messaging (Firestore `onSnapshot`)
- Contacts list to start or resume a conversation
- Profile with display name, bio, and avatar upload
- Auth-gated navigation
- Firestore and Storage security rules in the repo
- Web export + Firebase Hosting, and EAS profiles for TestFlight

## Stack

| Layer | Choice |
|-------|--------|
| App | Expo 54, React Native, expo-router, TypeScript |
| Auth | Firebase Authentication (email/password) |
| Data | Cloud Firestore (users, rooms, messages) |
| Media | Firebase Storage (avatars) |
| Platforms | iOS, Android, web |

## Quick start

**Requirements:** Node 20+, [Yarn](https://yarnpkg.com/), a [Firebase](https://console.firebase.google.com) project.

```bash
git clone https://github.com/tonymelek/chat-starter.git
cd chat-starter
yarn install
cp .env.example .env.local
```

Fill `.env.local` with your Firebase **web app** config (Console → Project settings → Your apps). Then:

```bash
yarn start          # Expo dev server
yarn web            # Web only
yarn ios            # iOS simulator
yarn android        # Android emulator
```

Complete the one-time Firebase setup in [docs/SETUP.md](docs/SETUP.md) (Auth provider, rules, composite index). Without that, login or the home screen will fail.

Open a second browser/incognito window, create two accounts, and start a chat from **Contacts**.

## Project structure

```
app/
  (tabs)/index.tsx      # Messages — room list
  (tabs)/explore.tsx    # Contacts — start a DM
  (tabs)/settings.tsx   # Settings + logout
  chat/[id].tsx         # Conversation
  login.tsx             # Sign in / sign up / reset
  profile/index.tsx     # Profile + avatar
context/auth.tsx        # Auth state + route guard
lib/firebase.ts         # Firebase init (import as @/lib/firebase)
lib/users.ts            # User doc sync helpers
lib/firebase-errors.ts  # Friendly Auth / Firestore errors
firebase/               # Security rules + Firestore indexes
docs/                   # Setup, schema, roadmap
```

Import Firebase from `@/lib/firebase`, not `@/firebase` — that path collides with the npm `firebase` package.

## Scripts

| Command | Purpose |
|---------|---------|
| `yarn start` | Expo dev server |
| `yarn web` / `yarn ios` / `yarn android` | Platform-specific dev |
| `yarn lint` | ESLint |
| `yarn build:web` | Static web export to `dist/` |
| `yarn deploy:web` | Export + deploy Firebase Hosting |
| `yarn deploy:rules` | Deploy Firestore rules, indexes, and Storage rules |

## Docs

| Doc | What it’s for |
|-----|----------------|
| [**Setup**](docs/SETUP.md) | Firebase Console, env, deploy, TestFlight |
| [**Schema**](docs/SCHEMA.md) | Firestore & Storage data model |
| [**Roadmap**](docs/ROADMAP.md) | What’s in, what’s next |
| [**Contributing**](CONTRIBUTING.md) | How to send changes |

## Architecture

```
┌─────────────┐     ┌─────────────┐
│  Client A   │     │  Client B   │
│ Expo (RN)   │     │ Expo (RN)   │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └────────┬──────────┘
                ▼
        Firebase project
   ┌────────────┼────────────┐
   │            │            │
 Auth      Firestore      Storage
 email     users          avatars/{uid}
           chatRooms
             messages
```

Conversations are **1:1 only**. A room’s `participants` array holds exactly two Auth UIDs. User documents use the Auth `uid` as the document ID.

## What’s not included

Intentionally out of scope for a starter:

- Group chats
- Image / file messages
- Push notifications
- Read receipts and typing indicators
- Phone / social sign-in

See [docs/ROADMAP.md](docs/ROADMAP.md) if you want to add them.

## Founder

Founded by [Meltek](https://meltek.com.au) — software engineering studio · Melbourne.

## License

MIT — see [LICENSE](LICENSE).
