# Contributing

Thanks for taking an interest in Chat Starter. The goal is to stay a **readable starter**, not a full-featured messenger.

## Before you start

1. Follow [docs/SETUP.md](docs/SETUP.md) with your own Firebase project.
2. Read [docs/SCHEMA.md](docs/SCHEMA.md) before changing Firestore or Storage usage.
3. Match existing `StyleSheet` patterns on each screen. Don’t introduce a second UI system in a small PR.

## Local workflow

```bash
yarn install
cp .env.example .env.local   # then fill in Firebase config
yarn start
yarn lint
```

Use two accounts (two browsers or a simulator + web) to verify real-time chat.

## Pull requests

- Keep the diff focused. A starter is easier to learn when PRs do one thing.
- If you add a Firestore field, update `docs/SCHEMA.md` in the same PR.
- If you change security rules, mention that forks must run `yarn deploy:rules`.
- Don’t commit `.env.local`, `.firebaserc`, or secrets.

## What usually belongs here vs a fork

**Good for this repo:** bug fixes, clearer docs, small UX gaps (empty/error states), types, rules that match the schema.

**Better as a fork:** group chat, push notifications, a new design system, extra auth providers. See [docs/ROADMAP.md](docs/ROADMAP.md).
