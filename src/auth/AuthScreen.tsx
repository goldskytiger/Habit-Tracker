import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './AuthContext';

const PURPLE = '#6C47FF';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function switchMode(next: 'signin' | 'signup') {
    setMode(next);
    setError(null);
    setInfo(null);
    setPassword('');
    setConfirm('');
  }

  async function handleSubmit() {
    setError(null);
    setInfo(null);
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const err =
      mode === 'signin'
        ? await signIn(trimEmail, password)
        : await signUp(trimEmail, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else if (mode === 'signup') {
      setInfo('Account created! Check your email to confirm, then sign in.');
      switchMode('signin');
    }
    // On successful sign in, AuthContext updates session and App re-renders automatically
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.top}>
          <Text style={styles.logo}>🌱</Text>
          <Text style={styles.appName}>Habit Tracker</Text>
          <Text style={styles.tagline}>Build habits that last</Text>
        </View>

        <View style={styles.card}>
          {/* Mode toggle */}
          <View style={styles.toggle}>
            {(['signin', 'signup'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
                onPress={() => switchMode(m)}
              >
                <Text style={[styles.toggleBtnText, mode === m && styles.toggleBtnTextActive]}>
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {info && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>{info}</Text>
            </View>
          )}

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#BBB"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#BBB"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />

          {mode === 'signup' && (
            <>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#BBB"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                autoComplete="new-password"
              />
            </>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  top: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 64, marginBottom: 12 },
  appName: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', marginBottom: 6 },
  tagline: { fontSize: 15, color: '#888' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  toggleBtnText: { fontSize: 14, fontWeight: '600', color: '#888' },
  toggleBtnTextActive: { color: '#1A1A1A' },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoBanner: {
    backgroundColor: '#F0FFF4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  infoText: { color: '#276749', fontSize: 13, fontWeight: '500', textAlign: 'center' },
  submitBtn: {
    backgroundColor: PURPLE,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: { color: '#FFF', fontWeight: '700', fontSize: 17 },
});
