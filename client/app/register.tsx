import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Pressable,
} from "react-native";
import React, { useRef, useState } from "react";
import CustomKeyboardAvoidingView from "./components/scrollableScreen";
import CustomTextInput from "./components/customTextInput";
import { useRouter } from "expo-router";
import { COLORS } from "@/consts/colors";
import { ChevronLeft } from "lucide-react-native";

export default function Register() {
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [currentIndex, setCurrentIndex] = useState<number>(1);

    const router = useRouter();

    const { width } = Dimensions.get("window");

    const scrollRef = useRef<ScrollView>(null);
    const [userInfo, setUserInfo] = useState({
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
    });

    const handleNext = () => {
        scrollRef.current?.scrollTo({
            x: width * currentIndex,
            animated: true,
        });
        setCurrentIndex((prevIndex) => (prevIndex < 3 ? prevIndex + 1 : 3));
    };

    const handleBack = () => {
        scrollRef.current?.scrollTo({
            x: width * (currentIndex - 2),
            animated: true,
        });
        setCurrentIndex((prevIndex) => (prevIndex > 1 ? prevIndex - 1 : 1));
    };

    return (
        <CustomKeyboardAvoidingView>
            <View className="bg-gray-950 flex-1 justify-center items-center gap-4">
                <View className="max-w-sm w-full flex flex-row gap-4 pb-4 border-gray-900 border-b">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-gray-800 aspect-square rounded-xl"
                    >
                        <ChevronLeft color={COLORS.gray200} size={30} />
                    </TouchableOpacity>
                    <Text className="text-gray-100 text-3xl font-bold">
                        Register
                    </Text>
                </View>
                <ScrollView
                    ref={scrollRef}
                    scrollEnabled={false}
                    horizontal={true}
                    pagingEnabled={true}
                    contentContainerClassName="flex-row"
                    className="max-h-40"
                >
                    <View className="flex-col w-screen h-full border gap-4 items-center justify-center">
                        <View className="max-w-sm w-full gap-4">
                            <CustomTextInput
                                placeholder="First Name"
                                value={userInfo.firstName}
                            />
                            <CustomTextInput
                                placeholder="Last Name"
                                value={userInfo.lastName}
                            />
                        </View>
                    </View>
                    <View className="flex-col w-screen h-full border gap-4 items-center justify-center">
                        <View className="max-w-sm w-full gap-4">
                            <CustomTextInput
                                placeholder="Password"
                                secureTextEntry={secureTextEntry}
                                setSecureTextEntry={setSecureTextEntry}
                            />
                            <CustomTextInput
                                placeholder="Confirm Password"
                                secureTextEntry={secureTextEntry}
                                setSecureTextEntry={setSecureTextEntry}
                            />
                        </View>
                    </View>
                    <View className="flex-col w-screen h-full border gap-4 items-center justify-center">
                        <View className="max-w-sm w-full gap-4">
                            <CustomTextInput placeholder="Phone Number" />
                            <CustomTextInput placeholder="Email" />
                        </View>
                    </View>
                </ScrollView>
                <View className="flex flex-row w-full gap-4 max-w-sm justify-between">
                    {currentIndex > 1 && (
                        <Pressable
                            onPress={handleBack}
                            className="bg-red-500 rounded-xl w-5/12"
                        >
                            <Text className="text-gray-200 px-8 py-4 text-xl font-bold text-center">
                                Back
                            </Text>
                        </Pressable>
                    )}
                    <Pressable
                        onPress={handleNext}
                        className={`bg-blue-500 rounded-xl ${currentIndex > 1 ? "w-5/12" : "w-full"} transition-all hover:bg-blue-400`}
                    >
                        <Text className="text-gray-200 px-8 py-4 text-xl font-bold text-center">
                            {currentIndex === 3 ? "Submit" : "Next"}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </CustomKeyboardAvoidingView>
    );
}
