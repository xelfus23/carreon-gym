import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Pressable,
} from "react-native";
import React, { useRef, useState } from "react";
import CustomKeyboardAvoidingView from "./components/CustomKeyboardAvoidingView";
import CustomTextInput from "./components/CustomTextInput";
import { useRouter } from "expo-router";
import { COLORS } from "@/src/consts/colors";
import { ChevronLeft } from "lucide-react-native";
import Loader from "./components/Loader";

type UserInfoProps = {
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    email: string;
};
export default function Register() {
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [currentIndex, setCurrentIndex] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const router = useRouter();

    const { width } = Dimensions.get("window");

    const scrollRef = useRef<ScrollView>(null);

    const [userInfo, setUserInfo] = useState<UserInfoProps>({
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
        email: "",
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

    const handleRegister = async () => {
        setIsLoading(true);

        try {
            console.log("Register");
            setTimeout(() => {
                router.navigate("/(drawer)/(home)/dashboard");
                setIsLoading(false);
            }, 1000);
        } catch (err) {
            if (err instanceof Error) {
                console.log(err.message);
            }
        }
    };

    return (
        <CustomKeyboardAvoidingView>
            <View className="bg-background flex-1 justify-center items-center gap-4">
                <View className="max-w-sm w-full flex flex-row gap-4 pb-4 border-b border-border items-center">
                    <TouchableOpacity
                        onPress={() =>
                            currentIndex === 1 ? router.back() : handleBack()
                        }
                        className="bg-border flex aspect-square items-center justify-center rounded-xl"
                    >
                        <ChevronLeft color={COLORS.textSecondary} size={30} />
                    </TouchableOpacity>
                    <Text className="text-primary text-4xl font-interBold h-14 align-middle">
                        Register
                    </Text>
                </View>
                <ScrollView
                    ref={scrollRef}
                    scrollEnabled={false}
                    horizontal={true}
                    pagingEnabled={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="flex-row"
                    className="max-h-40"
                >
                    <View className="flex-col w-screen h-full gap-4 items-center justify-center">
                        <View className="max-w-sm w-full gap-4">
                            <CustomTextInput
                                placeholder="First Name"
                                value={userInfo.firstName}
                                onChangeText={(val) =>
                                    setUserInfo((prev) => ({
                                        ...prev,
                                        firstName: val,
                                    }))
                                }
                            />
                            <CustomTextInput
                                placeholder="Last Name"
                                value={userInfo.lastName}
                                onChangeText={(val) =>
                                    setUserInfo((prev) => ({
                                        ...prev,
                                        lastName: val,
                                    }))
                                }
                            />
                        </View>
                    </View>
                    <View className="flex-col w-screen h-full gap-4 items-center justify-center">
                        <View className="max-w-sm w-full gap-4">
                            <CustomTextInput
                                placeholder="Password"
                                secureTextEntry={secureTextEntry}
                                setSecureTextEntry={setSecureTextEntry}
                                value={userInfo.password}
                                onChangeText={(val) =>
                                    setUserInfo((prev) => ({
                                        ...prev,
                                        password: val,
                                    }))
                                }
                            />
                            <CustomTextInput
                                placeholder="Confirm Password"
                                secureTextEntry={secureTextEntry}
                                setSecureTextEntry={setSecureTextEntry}
                                value={userInfo.confirmPassword}
                                onChangeText={(val) =>
                                    setUserInfo((prev) => ({
                                        ...prev,
                                        confirmPassword: val,
                                    }))
                                }
                            />
                        </View>
                    </View>
                    <View className="flex-col w-screen h-full gap-4 items-center justify-center">
                        <View className="max-w-sm w-full gap-4">
                            <CustomTextInput
                                placeholder="Phone Number"
                                value={userInfo.phoneNumber}
                                onChangeText={(val) =>
                                    setUserInfo((prev) => ({
                                        ...prev,
                                        phoneNumber: val,
                                    }))
                                }
                            />
                            <CustomTextInput
                                placeholder="Email"
                                value={userInfo.email}
                                onChangeText={(val) =>
                                    setUserInfo((prev) => ({
                                        ...prev,
                                        email: val,
                                    }))
                                }
                            />
                        </View>
                    </View>
                </ScrollView>
                <View className="flex flex-row w-full gap-4 max-w-sm justify-between">
                    <Pressable
                        disabled={isLoading}
                        onPress={
                            currentIndex === 3 ? handleRegister : handleNext
                        }
                        className={`${isLoading ? "bg-surface" : "bg-primary"} rounded-xl w-full transition-all hover:bg-blue-400`}
                    >
                        <Text className="text-background px-8 py-4 text-xl font-interBold text-center">
                            {isLoading ? (
                                <Loader />
                            ) : currentIndex === 3 ? (
                                "Submit"
                            ) : (
                                "Next"
                            )}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </CustomKeyboardAvoidingView>
    );
}
