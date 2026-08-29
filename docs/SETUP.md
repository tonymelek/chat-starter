# Setup

One-time Firebase (and optional deploy) steps so the app can actually chat. Do these on **your** Firebase project, not a shared demo.

---

## 1. Create a Firebase project

1. Open [Firebase Console](https://console.firebase.google.com) and create a project (or pick an existing one).
2. Add a **Web** app (Project settings → Your apps). Copy the config object.
3. Copy `.env.example` → `.env.local` and fill in:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Never commit `.env.local`. Client Firebase keys are expected to ship in the app; **security rules** and **authorized domains** are what protect the project.

4. Copy `.firebaserc.example` → `.firebaserc` and set `default` to your project ID.

---

## 2. Enable Email/Password auth

Authentication → Sign-in method → enable **Email/Password**.

After you deploy web hosting, add that URL under Authentication → Settings → **Authorized domains**.

---

## 3. Firestore

Create a Firestore database (production mode is fine — you will deploy rules next).

### Security rules

From the repo root, after `firebase login`:

```bash
yarn deploy:rules
```

That publishes:

- [`firebase/firestore.rules`](../firebase/firestore.rules)
- [`firebase/firestore.indexes.json`](../firebase/firestore.indexes.json)
- [`firebase/storage.rules`](../firebase/storage.rules)

You can also paste the rules files into the Console and click **Publish**.

The shipped rules reject sender impersonation, extra message fields, and rooms that are not exactly two distinct users. If create/send fails with `permission-denied` after a custom schema change, update `firebase/firestore.rules` to match — don’t loosen them back to “any participant may write anything.”

### Composite index

The home screen query is:

`chatRooms` where `participants` array-contains `uid`, order by `updatedAt` desc

`yarn deploy:rules` deploys that index from `firebase/firestore.indexes.json`. Wait until the index status is **Enabled** (a few minutes). You can also create it manually:

| Field | Mode |
|-------|------|
| `participants` | Arrays |
| `updatedAt` | Descending |

---

## 4. Storage

Enable Storage if it is not on yet, then deploy rules (`yarn deploy:rules` covers this). Avatars live at `avatars/{uid}`.

---

## 5. Verify locally

```bash
yarn start
```

1. Create **Account A** (sign up).
2. Create **Account B** in another browser or incognito window.
3. Account A → Contacts → tap Account B → send a message.
4. Account B should see it in real time.
5. Upload an avatar on Profile (confirms Storage rules).

---

## 6. Web deploy (optional)

```bash
npm install -g firebase-tools   # once
firebase login                  # once
yarn deploy:web
```

Enable Hosting in the Console first if prompted. Then add the Hosting URL (for example `https://YOUR_PROJECT.web.app`) to **Authorized domains**.

---

## 7. TestFlight (optional)

1. [Apple Developer Program](https://developer.apple.com/programs/) and an [Expo](https://expo.dev/signup) account
2. App Store Connect app whose bundle ID matches `app.json` (`com.chatmvp.app` — change this before a public release)
3. `npm install -g eas-cli && eas login`

```bash
eas build:configure   # first time only
eas build --platform ios --profile preview
eas submit --platform ios
```

Invite testers in App Store Connect → TestFlight.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| App throws `Missing EXPO_PUBLIC_FIREBASE_…` | No `.env.local` | Copy `.env.example` and fill values; restart Expo |
| Home screen empty / index error | Composite index not ready | Step 3 — wait until Enabled |
| `Missing or insufficient permissions` | Rules not deployed | `yarn deploy:rules` |
| Avatar upload fails | Storage not enabled or rules not published | Step 4 |
| Web login works locally but not on Hosting | Domain not authorized | Add Hosting URL to Auth authorized domains |
| No users in Contacts | Only one account, or rules block reads | Create a second account; check Firestore rules |
| `firebase deploy` can’t find a project | No `.firebaserc` | Copy `.firebaserc.example` and set your project ID |

---

## Nice-to-have (later)

- Separate **dev** Firebase project for local testing
- [Firebase App Check](https://firebase.google.com/docs/app-check) before a public URL
- Budget alerts in Google Cloud Console → Billing
- Custom Authentication email templates
