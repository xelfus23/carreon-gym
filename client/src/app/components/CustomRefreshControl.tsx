import { COLORS } from "@/src/consts/colors";
import { RefreshControl } from "react-native";

export const getCustomLoader = (refreshing: boolean, onRefresh: () => void) => (
  <RefreshControl
    refreshing={refreshing}
    onRefresh={onRefresh}
    colors={[COLORS.primary, COLORS.primaryDark]}
    tintColor={COLORS.primary}
    progressBackgroundColor="transparent"
  />
);
