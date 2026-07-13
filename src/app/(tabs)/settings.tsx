import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PurchasesPackage } from "react-native-purchases";
import {
  checkProStatus,
  getPackages,
  purchasePackage,
} from "../../lib/revenuecat";
import { supabase } from "../../lib/supabase";
import { useAccountStore } from "../../stores/accountStore";

export default function SettingsScreen() {
  const { accounts } = useAccountStore();
  const [isPro, setIsPro] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [purchasing, setPurchasing] = useState(false);
  const [loadingPro, setLoadingPro] = useState(true);

  useEffect(() => {
    const load = async () => {
      const pro = await checkProStatus();
      setIsPro(pro);
      const pkgs = await getPackages();
      setPackages(pkgs);
      setLoadingPro(false);
    };
    load();
  }, []);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    const success = await purchasePackage(pkg);
    setPurchasing(false);
    if (success) {
      setIsPro(true);
      Alert.alert("🎉 Welcome to Pro!", "You now have unlimited accounts.");
    } else {
      Alert.alert("Purchase failed", "Please try again.");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          const { clearLocalDataForUser } = require("../../lib/localdb");
          const userId = await supabase.auth.getUser();
          if (userId.data.user?.id) {
            clearLocalDataForUser(userId.data.user.id);
          }
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Total accounts tracked</Text>
          <Text style={styles.rowValue}>
            {accounts.length} / {isPro ? "∞" : "10"}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Plan</Text>
          <Text style={[styles.rowValue, isPro && styles.proText]}>
            {isPro ? "⭐ Pro" : "Free"}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>App version</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
      </View>

      {!isPro && (
        <View style={styles.upgradeCard}>
          <Text style={styles.upgradeTitle}>🚀 Upgrade to Pro</Text>
          <Text style={styles.upgradeText}>
            Unlimited accounts, export backup, and priority support.
          </Text>

          {loadingPro ? (
            <ActivityIndicator color="#6366F1" />
          ) : packages.length === 0 ? (
            <Text style={styles.noPackages}>
              Payments not available yet — coming soon!
            </Text>
          ) : (
            packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.identifier}
                style={[styles.upgradeBtn, purchasing && styles.btnDisabled]}
                onPress={() => handlePurchase(pkg)}
                disabled={purchasing}
              >
                <Text style={styles.upgradeBtnText}>
                  {purchasing
                    ? "Processing..."
                    : `${pkg.product.title} — ${pkg.product.priceString}`}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {isPro && (
        <View style={styles.proCard}>
          <Text style={styles.proCardTitle}>⭐ You're on Pro</Text>
          <Text style={styles.proCardText}>
            Enjoy unlimited accounts and all Pro features.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    padding: 24,
    paddingTop: 56,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.5,
    marginBottom: 28,
  },
  section: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#0F172A",
  },
  rowLabel: { fontSize: 14, color: "#64748B" },
  rowValue: { fontSize: 14, color: "#F8FAFC", fontWeight: "600" },
  proText: { color: "#F59E0B" },
  upgradeCard: {
    backgroundColor: "#1E1B4B",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#4338CA",
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 8,
  },
  upgradeText: {
    fontSize: 14,
    color: "#A5B4FC",
    lineHeight: 20,
    marginBottom: 16,
  },
  upgradeBtn: {
    backgroundColor: "#6366F1",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  btnDisabled: { opacity: 0.6 },
  upgradeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  noPackages: { color: "#64748B", fontSize: 13, textAlign: "center" },
  proCard: {
    backgroundColor: "#1C1A00",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F59E0B44",
  },
  proCardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F59E0B",
    marginBottom: 8,
  },
  proCardText: { fontSize: 14, color: "#A5B4FC" },
  logoutBtn: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 40,
  },
  logoutText: { color: "#EF4444", fontWeight: "700", fontSize: 15 },
});
