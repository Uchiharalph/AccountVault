import { useEffect, useState } from "react";
import { checkProStatus } from "../../lib/revenuecat";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAccountStore } from "../../stores/accountStore";
import { Category } from "../../types";

const CATEGORIES: Category[] = [
  "Social Media",
  "Shopping",
  "Banking & Finance",
  "Entertainment",
  "Work & Productivity",
  "Education",
  "Health & Fitness",
  "Travel",
  "Gaming",
  "Other",
];

const LOGIN_METHODS = [
  "Email/Password",
  "Google",
  "Apple",
  "Facebook",
  "Other",
];

export default function AddScreen() {
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
      checkProStatus().then(setIsPro);
    }, []);
  const { addAccount, accounts } = useAccountStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState<Category>("Other");
  const [loginMethod, setLoginMethod] = useState("Email/Password");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!isPro && accounts.length >= 10) {
      Alert.alert(
        "Free Limit Reached",
        "Upgrade to Pro for unlimited accounts."
      );
      return;
    }

    // Free tier limit
    if (accounts.length >= 10) {
      Alert.alert(
        "Free Limit Reached",
        "You have reached the 10 account limit on the free plan. Upgrade to Pro for unlimited accounts.",
        [{ text: "OK" }]
      );
      return;
    }

    setLoading(true);
    await addAccount({
      name: name.trim(),
      email_used: email.trim(),
      website_url: website.trim() || undefined,
      category,
      login_method: loginMethod as any,
      notes: notes.trim() || undefined,
      is_active: true,
    });
    setLoading(false);
    setName("");
    setEmail("");
    setWebsite("");
    setCategory("Other");
    setLoginMethod("Email/Password");
    setNotes("");
    Alert.alert("✅ Saved", `${name} has been added to your vault.`);
    router.replace("/(tabs)/");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0F172A" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Add Account</Text>
        <Text style={styles.subtitle}>Log a new app or website account</Text>

        <Text style={styles.label}>App / Website Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Netflix, Twitter, GTBank"
          placeholderTextColor="#475569"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Email Used *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. you@gmail.com"
          placeholderTextColor="#475569"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Website URL (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. netflix.com"
          placeholderTextColor="#475569"
          value={website}
          onChangeText={setWebsite}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.chipText,
                  category === cat && styles.chipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>How do you log in?</Text>
        <View style={styles.chipGrid}>
          {LOGIN_METHODS.map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.chip,
                loginMethod === method && styles.chipActive,
              ]}
              onPress={() => setLoginMethod(method)}
            >
              <Text
                style={[
                  styles.chipText,
                  loginMethod === method && styles.chipTextActive,
                ]}
              >
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. Use Google login, registered with work email..."
          placeholderTextColor="#475569"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleAdd}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Saving..." : "Save Account"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 56 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#334155",
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  chipActive: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  chipText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  btn: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 32,
    marginBottom: 40,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});