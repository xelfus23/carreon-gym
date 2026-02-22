import { View, Text } from "react-native";
import Loader from "../Loader";

export function PlansLoading() {
    return (
        <View className="flex-1 bg-background items-center justify-center">
            <Loader size={50} />
            <Text className="text-text-secondary mt-4">
                Loading your workout plans...
            </Text>
        </View>
    );
}
