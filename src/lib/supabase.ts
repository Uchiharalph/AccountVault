import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rizlvickefeebkggtmls.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpemx2aWNrZWZlZWJrZ2d0bWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0OTQ2NTQsImV4cCI6MjA5OTA3MDY1NH0.hiE-l0NGt3PgxzJJTjiizUE-FXEPh5_TgQvrhFpF_80";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});