import { Image, Text, View } from "react-native";
import { ThinkingProps } from "@/src/types/chats";

export default function ThinkingBlock({ status }: ThinkingProps) {
    console.log(status);
    const isDone = status === "Done" || "Error" ? true : false;

    console.log(`ISDONE: ${isDone} STATUS: ${status}`);

    return (
        <View className="flex-row items-center gap-2">
            <Image
                source={require("../../../assets/ui/star-icon.png")}
                resizeMode="contain"
                resizeMethod="none"
                className={`w-4 aspect-square ${isDone ? "animate-none" : "animate-spin"}`}
            />
            <Text
                className={`text-text-secondary text-xs font-bold ${isDone ? "animate-none" : "animate-pulse"}`}
            >
                {status && status.replace(/_/g, " ")}
            </Text>
        </View>
    );
}
