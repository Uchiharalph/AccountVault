import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAccountStore } from "../../stores/accountStore";

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accounts, deleteAccount, updateAccount } = useAccountStore();
  const account = accounts.find((a) => a.id === id);

  if (!account) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff", padding: 24 }}>
          Account not found.
        </Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Account",
      `Remove ${account.name} from your vault?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteAccount(account.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleMarkUsed = async () => {
    await updateAccount(account.id, {
      last_used_at: new Date().toISOString(),
    });
    Alert.alert("Updated", "Last used time updated.");
  };

  const rows = [
    { label: "Email Used", value: account.email_used },
    { label: "Login Method", value: account.login_method },
    { label: "Category", value: account.category },
    { label: "Website", value: account.website_url || "—" },
    { label: "Notes", value: account.notes || "—" },
    {
      label: "Added",
      value: new Date(account.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
    {
      label: "Last Used",
      value: account.last_used_at
        ? new Date(account.last_used_at).toLocaleDateString()
        : "Not recorded",
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.name}>{account.name}</Text>
          <Text style={styles.email}>{account.email_used}</Text>
        </View>

        <View style={styles.section}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleMarkUsed}
          >
            <Text style={styles.actionBtnText}>✓ Mark as used today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>🗑 Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    padding: 24,
    paddingTop: 56,
    backgroundColor: "#1E293B",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  backBtn: { marginBottom: 16 },
  backText: { color: "#6366F1", fontSize: 15, fontWeight: "600" },
  name: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  email: { fontSize: 14, color: "#64748B", marginTop: 4 },
  section: {
    margin: 24,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#0F172A",
  },
  rowLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    color: "#F8FAFC",
    flex: 2,
    textAlign: "right",
  },
  actions: { paddingHorizontal: 24, gap: 12, paddingBottom: 40 },
  actionBtn: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  actionBtnText: { color: "#6366F1", fontWeight: "700", fontSize: 15 },
  deleteBtn: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EF444433",
  },
  deleteBtnText: { color: "#EF4444", fontWeight: "700", fontSize: 15 },
});