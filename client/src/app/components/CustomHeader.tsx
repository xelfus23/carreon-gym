import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // <--- MAKE SURE IT IS THIS IMPORT
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { Menu } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";

interface CustomHeaderProps {
    title: string;
}

export default function CustomHeader({ title }: CustomHeaderProps) {
    const navigation = useNavigation();

    return (
        <View className="bg-surface border-b border-border">
            <SafeAreaView edges={["top"]} className="bg-surface">
                <View className="h-16 flex-row items-center px-4">
                    <View className="flex-1 justify-center">
                        <Text className="text-2xl font-bold text-gray-200 capitalize">
                            {title}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() =>
                            navigation.dispatch(DrawerActions.toggleDrawer())
                        }
                        className="p-2 bg-border rounded-full"
                    >
                        <Menu color={COLORS.primaryDark} size={24} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}
