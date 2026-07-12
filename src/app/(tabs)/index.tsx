import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { useAccountStore } from "../../stores/accountStore";
import { Account } from "../../types";

const CATEGORY_COLORS: Record<string, string> = {
  "Social Media": "#EC4899",
  "Shopping": "#F59E0B",
  "Banking & Finance": "#10B981",
  "Entertainment": "#8B5CF6",
  "Work & Productivity": "#3B82F6",
  "Education": "#06B6D4",
  "Health & Fitness": "#EF4444",
  "Travel": "#F97316",
  "Gaming": "#A855F7",
  "Other": "#64748B",
};

const CATEGORY_ICONS: Record<string, string> = {
  "Social Media": "📱",
  "Shopping": "🛍️",
  "Banking & Finance": "🏦",
  "Entertainment": "🎬",
  "Work & Productivity": "💼",
  "Education": "📚",
  "Health & Fitness": "💪",
  "Travel": "✈️",
  "Gaming": "🎮",
  "Other": "🌐",
};

function AccountCard({ account }: { account: Account }) {
  const color = CATEGORY_COLORS[account.category] || "#64748B";
  const icon = CATEGORY_ICONS[account.category] || "🌐";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/account/${account.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.cardIcon, { backgroundColor: color + "22" }]}>
        <Text style={styles.cardIconText}>{icon}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{account.name}</Text>
        <Text style={styles.cardEmail}>{account.email_used}</Text>
        <View style={[styles.categoryBadge, { backgroundColor: color + "22" }]}>
          <Text style={[styles.categoryText, { color }]}>
            {account.category}
          </Text>
        </View>
      </View>
      <Text style={styles.cardArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { accounts, loading, fetchAccounts } = useAccountStore();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filtered = accounts.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email_used.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      !selectedCategory || a.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const categories = [...new Set(accounts.map((a) => a.category))];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Accounts</Text>
          <Text style={styles.headerSub}>
            {accounts.length} accounts tracked
          </Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search accounts..."
          placeholderTextColor="#475569"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {categories.length > 0 && (
        <FlatList
          horizontal
          data={["All", ...categories]}
          keyExtractor={(i) => i}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => {
            const isAll = item === "All";
            const active = isAll
              ? !selectedCategory
              : selectedCategory === item;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  active && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategory(isAll ? null : item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AccountCard account={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchAccounts}
            tintColor="#6366F1"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🗂️</Text>
            <Text style={styles.emptyTitle}>No accounts yet</Text>
            <Text style={styles.emptySub}>
              Tap the + tab below to add your first account
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: 56,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 2 },
  searchRow: { paddingHorizontal: 24, marginBottom: 12 },
  searchInput: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#334155",
  },
  filterRow: { paddingHorizontal: 24, paddingBottom: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  filterChipActive: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  filterChipText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },
  list: { padding: 24, paddingTop: 8, gap: 12 },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    gap: 14,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardIconText: { fontSize: 22 },
  cardBody: { flex: 1, gap: 4 },
  cardName: { fontSize: 16, fontWeight: "700", color: "#F8FAFC" },
  cardEmail: { fontSize: 13, color: "#64748B" },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
    marginTop: 2,
  },
  categoryText: { fontSize: 11, fontWeight: "700" },
  cardArrow: { fontSize: 22, color: "#334155" },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});