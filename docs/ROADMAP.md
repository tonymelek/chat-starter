# Roadmap

Chat Starter is a **starter**: 1:1 text chat on Expo + Firebase. Use this list if you fork the repo and want a sense of natural next steps.

## In the box

- Email/password auth, password reset
- User directory (Contacts) and 1:1 rooms
- Real-time text messages
- Profile fields + avatar upload
- Security rules and the home-screen composite index
- Web hosting and EAS/TestFlight config files

## Good first extensions

| Idea | Why |
|------|-----|
| Push notifications | FCM + Expo notifications so messages arrive in the background |
| Image messages | Storage path per room + `imageUrl` on the message doc |
| Group chats | `participants` already an array; rules and UI assume length 2 today |
| Read receipts | `readBy` on messages (already noted as a schema gap) |
| Typing indicators | Short-lived presence field or RTDB |
| Search / usernames | Contacts currently loads the full `users` collection |

## Production hardening

- Firebase App Check
- Separate dev and prod Firebase projects
- Rate limits / abuse controls beyond rules
- Phone or social sign-in
- Custom domain on Hosting
- Public App Store / Play listing (change `com.chatmvp.app` first)
