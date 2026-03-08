import { View, Text } from "react-native";
import { Dumbbell } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";

export default function PlansEmpty() {
    return (
        <View className="items-center justify-center flex-1 bg-background p-12">
            <View className="rotate-45">
                <Dumbbell color={COLORS.textSecondary} size={45} />
            </View>
            <Text className="text-text-primary font-bold text-xl mt-4 text-center">
                No Workout Plans Yet
            </Text>
            <Text className="text-text-secondary text-center mt-2">
                Chat with your AI trainer to create a personalized workout plan!
            </Text>
        </View>
    );
}
