import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  View,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { Brand } from "@/constants/brand";
import { getClientAuth } from "@/lib/firebase";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import { syncUserDoc } from "@/lib/users";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const validate = (): string | null => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      return "Please fill out all fields.";
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return "Please enter a valid email address.";
    }
    if (!isLogin && password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    return null;
  };

  const handleAuth = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setResetSent(false);
    const trimmedEmail = email.trim();

    try {
      const userCredential = isLogin
        ? await signInWithEmailAndPassword(getClientAuth(), trimmedEmail, password)
        : await createUserWithEmailAndPassword(getClientAuth(), trimmedEmail, password);

      await syncUserDoc(userCredential.user);
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email above, then tap Forgot password.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    setResetSent(false);

    try {
      await sendPasswordResetEmail(getClientAuth(), trimmedEmail);
      setResetSent(true);
      Alert.alert("Check your email", "We sent a password reset link to your inbox.");
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.body}>
        <View style={styles.brand}>
          <Image
            source={require("@/assets/images/meltek-mark.png")}
            style={styles.mark}
            accessibilityLabel="Meltek"
          />
          <Text style={styles.productName}>Chat</Text>
          <Text style={styles.credit}>{Brand.credit}</Text>
        </View>

        <Text style={styles.title}>{isLogin ? "Welcome Back" : "Create Account"}</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {resetSent ? (
          <Text style={styles.successText}>Password reset email sent.</Text>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={isLogin ? "current-password" : "new-password"}
        />

        {isLogin ? (
          <TouchableOpacity style={styles.forgotButton} onPress={handlePasswordReset} disabled={loading}>
            <Text style={styles.forgotButtonText}>Forgot password?</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isLogin ? "Sign In" : "Sign Up"}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => {
            setIsLogin(!isLogin);
            setError("");
            setResetSent(false);
          }}
        >
          <Text style={styles.switchButtonText}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.studioLink}
        onPress={() => Linking.openURL(Brand.url)}
        accessibilityRole="link"
      >
        <Text style={styles.studioLinkText}>{Brand.name} · {Brand.tagline}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.mist,
  },
  body: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  brand: {
    alignItems: "center",
    marginBottom: 28,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: 14,
  },
  productName: {
    fontSize: 22,
    fontWeight: "700",
    color: Brand.ink,
    letterSpacing: 0.3,
  },
  credit: {
    marginTop: 4,
    fontSize: 13,
    color: Brand.sea,
    fontWeight: "500",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: Brand.ink,
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: Brand.ink,
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 16,
    marginTop: -4,
  },
  forgotButtonText: {
    color: Brand.sea,
    fontSize: 14,
  },
  button: {
    backgroundColor: Brand.coral,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  switchButton: {
    alignItems: "center",
  },
  switchButtonText: {
    color: Brand.sea,
    fontSize: 16,
  },
  errorText: {
    color: "#dc2626",
    marginBottom: 15,
    textAlign: "center",
  },
  successText: {
    color: "#16a34a",
    marginBottom: 15,
    textAlign: "center",
  },
  studioLink: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  studioLinkText: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
});
