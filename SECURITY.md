# Security

## Reporting a vulnerability

Please open a private GitHub security advisory on this repository, or email the maintainer. Don’t file a public issue for anything that could be exploited (rules bypasses, auth holes, secret leaks).

## What this starter assumes

- Firebase **client** config (`EXPO_PUBLIC_*`) is public by design. Protect the project with:
  - Firestore and Storage **security rules** (deploy from `firebase/`)
  - Auth **authorized domains**
  - API key **application restrictions** in Google Cloud Console
  - [App Check](https://firebase.google.com/docs/app-check) before you share a public URL
- Never commit `.env.local`, `.firebaserc`, or service account JSON.
- Change `com.chatmvp.app` in `app.json` before publishing to the stores.

## Firestore integrity (shipped in rules)

The rules in `firebase/firestore.rules` are part of the starter, not optional polish:

- A room participant cannot create a message with another user’s `senderId`.
- Rooms are 1:1: create requires two distinct UIDs that already have `users/{uid}` docs, and `participants` cannot be changed later.
- Message and room writes are field-whitelisted (no extra keys, bounded `text` / `name` / `lastMessage`).

Forks must run `yarn deploy:rules` or the Console will keep whatever was published last — including open/test-mode rules.

## History rewrite

The original `Initial commit` on this repo contained a hardcoded Firebase web config (`firebase/index.ts`) and a project-specific Firestore index URL for `testfunctions-3304f`. That history was replaced with a clean root commit before the public starter release.

If you cloned **before** that rewrite:

1. Delete the old clone and clone again (or fetch the new root and reset — do not keep the old objects around).
2. Do **not** reuse `testfunctions-3304f`. Use your own Firebase project via `.env.local`.
3. If you ever pointed a running app at that project, restrict or rotate its Browser API key in Google Cloud Console → APIs & Services → Credentials, lock Auth authorized domains, and confirm Firestore/Storage are not in test mode.

Firebase web API keys are not secret in the same way as a service account, but an unrestricted key plus open rules is enough for abuse. Treat the old project as burned for a public demo.
