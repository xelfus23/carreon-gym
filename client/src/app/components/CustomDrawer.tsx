import { View, Text, Image, TouchableOpacity } from "react-native";
import {
    DrawerContentScrollView,
    DrawerItemList,
} from "@react-navigation/drawer";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LogOut, User } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";
import { useRouter } from "expo-router";

export default function CustomDrawerContent(props: any) {
    const { bottom } = useSafeAreaInsets();
    const router = useRouter();

    const handleLogout = () => {
        console.log("Logging out...");
        router.replace("/login"); // Redirect to login
    };

    return (
        <View className="flex-1 bg-surface border-border rounded-r-xl">
            <SafeAreaView
                className="flex-1 bg-background"
                edges={["left", "right"]}
            >
                <View className="flex-1 bg-surface rounded-r-xl">
                    <DrawerContentScrollView {...props}>
                        <View className="bg-surface p-6 mb-4 border-b border-border">
                            <View className="h-32 aspect-square bg-gray-700 rounded-full items-center justify-center mb-3">
                                <User color={COLORS.primary} size={40} />
                            </View>
                            <View className="pl-4">
                                <Text className="text-white text-lg font-bold">
                                    Test Name
                                </Text>
                                <Text className="text-gray-400 text-sm">
                                    test@gmail.com
                                </Text>
                            </View>
                        </View>

                        <View className="gap-0">
                            <DrawerItemList {...props} />
                        </View>
                    </DrawerContentScrollView>

                    <View
                        className="border-t border-border p-4"
                        style={{ paddingBottom: 20 + bottom }}
                    >
                        <TouchableOpacity
                            onPress={handleLogout}
                            className="flex-row items-center gap-3 p-2"
                        >
                            <LogOut size={20} color={COLORS.danger} />
                            <Text className="text-red-500 font-medium ml-2">
                                Log Out
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}
