import { Image, Text, View } from "react-native";
import { ThinkingProps } from "@/src/types/chats";

export default function ThinkingBlock({ status }: ThinkingProps) {
    return (
        <View className="flex-row items-center gap-2">
            <Image
                source={require("../../../assets/ui/star-icon.png")}
                resizeMode="contain"
                resizeMethod="none"
                className={`w-4 aspect-square ${status !== "Done" ? "animate-spin" : "animate-none"}`}
            />
            <Text
                className={`text-text-secondary text-xs font-bold ${status !== "Done" ? "animate-pulse" : "animate-none"}`}
            >
                {status && status.replace(/_/g, " ")}
            </Text>
        </View>
    );
}
