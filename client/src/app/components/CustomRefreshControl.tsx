import { COLORS } from "@/src/consts/colors";
import { RefreshControl } from "react-native";

export default function getCustomLoader(refreshing: boolean, onRefresh: () => void) {
  return <RefreshControl
    refreshing={refreshing}
    onRefresh={onRefresh}
    colors={[COLORS.primary, COLORS.primaryDark]}
    tintColor={COLORS.primary}
    progressBackgroundColor="transparent"
  />
};
