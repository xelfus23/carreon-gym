import {
    View,
    Text,
    Touchable,
    TouchableOpacity,
    TextInput,
    Pressable,
} from "react-native";
import React, { useState } from "react";
import { ChevronLeft } from "lucide-react-native";
import { COLORS } from "@/consts/colors";
import { useRouter } from "expo-router";
import CustomTextInput from "./components/customTextInput";
import CustomKeyboardAvoidingView from "./components/scrollableScreen";
export default function Login() {
    const router = useRouter();
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    return (
        <CustomKeyboardAvoidingView>
            <View className="bg-gray-950 flex-1 justify-center items-center">
                <View className="container max-w-sm border-white gap-4">
                    <View className="flex flex-row gap-4 pb-4 border-gray-900 border-b">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-gray-800 aspect-square rounded-xl"
                        >
                            <ChevronLeft color={COLORS.gray200} size={30} />
                        </TouchableOpacity>
                        <Text className="text-gray-100 text-3xl font-bold">
                            Login
                        </Text>
                    </View>
                    <View className="flex-col gap-4">
                        <CustomTextInput placeholder="Username" />
                        <CustomTextInput
                            placeholder="Password"
                            secureTextEntry={secureTextEntry}
                            setSecureTextEntry={setSecureTextEntry}
                        />
                    </View>
                    <TouchableOpacity className="bg-blue-500 rounded-xl">
                        <Text className="text-gray-200 px-8 py-4 text-xl font-bold text-center">
                            Login
                        </Text>
                    </TouchableOpacity>
                    <Text className="text-gray-300 text-center flex items-center justify-center">
                        Don't have account?{" "}
                        <Text
                            onPress={() => router.push("/register")}
                            className="text-blue-500 underline"
                        >
                            Register now!
                        </Text>
                    </Text>
                </View>
            </View>
        </CustomKeyboardAvoidingView>
    );
}
