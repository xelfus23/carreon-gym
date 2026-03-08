import { View, Text } from "react-native";
import Loader from "../Loader";

export default function CustomLoader(params: { text: string }) {
    return (
        <View className="flex-1 bg-background items-center justify-center">
            <Loader size={50} />
            <Text className="text-text-secondary mt-4">{params.text}</Text>
        </View>
    );
}
