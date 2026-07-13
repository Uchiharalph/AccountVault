import NetInfo from "@react-native-community/netinfo";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { initLocalDB } from "../lib/localdb";
import { initRevenueCat } from "../lib/revenuecat";
import { supabase } from "../lib/supabase";
import { setCachedUserId, useAccountStore } from "../stores/accountStore";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const syncPending = useAccountStore((state) => state.syncPending);

  useEffect(() => {
    // Initialize local DB
    initLocalDB();

    // Initialize RevenueCat
    initRevenueCat();

    // Listen for internet returning and sync pending accounts
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        syncPending();
      }
    });

    // Supabase auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        setCachedUserId(session.user.id);
        useAccountStore.getState().fetchAccounts();
      } else {
        setCachedUserId(null);
        router.replace("/(auth)/login");
      }
    });
    return () => {
      subscription.unsubscribe();
      unsubscribeNetInfo();
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.replace("/(tabs)/");
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [loading, session]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0F172A",
        }}
      >
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/signup" />
      <Stack.Screen name="account/[id]" options={{ presentation: "modal" }} />
    </Stack>
  );
}
