export function getFirebaseErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  const message = (error as { message?: string })?.message ?? "";

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "permission-denied":
      return "Permission denied. Deploy Firestore/Storage rules (see docs/SETUP.md).";
    case "failed-precondition":
      return "Database index missing. Deploy the Firestore index (see docs/SETUP.md).";
    default:
      if (message.toLowerCase().includes("index")) {
        return "Database index missing. Deploy the Firestore index (see docs/SETUP.md).";
      }
      return message || "Something went wrong. Please try again.";
  }
}
