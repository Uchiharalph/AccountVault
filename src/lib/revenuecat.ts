import Purchases, {
  LOG_LEVEL,
  PurchasesPackage,
} from "react-native-purchases";
import { Platform } from "react-native";

const RC_API_KEY_ANDROID = "goog_yJUuZgiTTWlaATEAVpAcqyRtiLG";

export const initRevenueCat = () => {
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  if (Platform.OS === "android") {
    Purchases.configure({ apiKey: RC_API_KEY_ANDROID });
  }
};

export const getPackages = async (): Promise<PurchasesPackage[]> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages || [];
  } catch (e) {
    console.log("RevenueCat error:", e);
    return [];
  }
};

export const purchasePackage = async (
  pkg: PurchasesPackage
): Promise<boolean> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active["pro"] !== undefined;
  } catch (e) {
    console.log("Purchase error:", e);
    return false;
  }
};

export const checkProStatus = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active["pro"] !== undefined;
  } catch (e) {
    return false;
  }
};