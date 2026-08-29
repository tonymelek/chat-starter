import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';

import { AccessibleField } from '@/components/ui/accessible-field';
import { LiveStatus } from '@/components/ui/live-status';
import { Brand } from '@/constants/brand';
import { hitSlop, minTouchSize } from '@/constants/a11y';
import { useBrandTheme } from '@/hooks/use-brand-theme';
import { getClientAuth } from '@/lib/firebase';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';
import { syncUserDoc } from '@/lib/users';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const theme = useBrandTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const validate = (): string | null => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      return 'Please fill out all fields.';
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }
    if (!isLogin && password.length < 6) {
      return 'Password must be at least 6 characters.';
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
    setError('');
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
      setError('Enter your email above, then tap Forgot password.');
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setResetSent(false);

    try {
      await sendPasswordResetEmail(getClientAuth(), trimmedEmail);
      setResetSent(true);
      Alert.alert('Check your email', 'We sent a password reset link to your inbox.');
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submitLabel = isLogin ? 'Sign In' : 'Sign Up';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.body}>
        <View style={styles.brand}>
          <Image
            source={require('@/assets/images/meltek-mark.png')}
            style={styles.mark}
            accessibilityLabel="Meltek"
          />
          <Text style={[styles.productName, { color: theme.text }]}>Chat</Text>
          <Text style={[styles.credit, { color: theme.accent }]}>{Brand.credit}</Text>
        </View>

        <Text
          style={[styles.title, { color: theme.text }]}
          accessibilityRole="header"
        >
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Text>
        <LiveStatus message={error} />
        <LiveStatus
          tone="success"
          message={resetSent ? 'Password reset email sent.' : ''}
        />

        <AccessibleField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="username"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="next"
          editable={!loading}
        />
        <AccessibleField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          textContentType={isLogin ? 'password' : 'newPassword'}
          returnKeyType="go"
          onSubmitEditing={handleAuth}
          editable={!loading}
        />

        {isLogin ? (
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={handlePasswordReset}
            disabled={loading}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
            accessibilityState={{ disabled: loading, busy: loading }}
          >
            <Text style={[styles.forgotButtonText, { color: theme.accent }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.action, minHeight: minTouchSize },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleAuth}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
          accessibilityState={{ disabled: loading, busy: loading }}
        >
          {loading ? (
            <ActivityIndicator color={theme.actionForeground} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.actionForeground }]}>
              {submitLabel}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => {
            setIsLogin(!isLogin);
            setError('');
            setResetSent(false);
          }}
          accessibilityRole="button"
          accessibilityLabel={
            isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'
          }
        >
          <Text style={[styles.switchButtonText, { color: theme.accent }]}>
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.studioLink}
        onPress={() => Linking.openURL(Brand.url)}
        accessibilityRole="link"
        accessibilityLabel={`${Brand.name}, ${Brand.tagline}`}
      >
        <Text style={[styles.studioLinkText, { color: theme.textMuted }]}>
          {Brand.name} · {Brand.tagline}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brand: {
    alignItems: 'center',
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
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  credit: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
    minHeight: minTouchSize,
    justifyContent: 'center',
  },
  forgotButtonText: {
    fontSize: 14,
  },
  button: {
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
    minHeight: minTouchSize,
    justifyContent: 'center',
  },
  switchButtonText: {
    fontSize: 16,
  },
  studioLink: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: minTouchSize,
  },
  studioLinkText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
