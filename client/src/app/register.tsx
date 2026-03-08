import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from "react-native";
import React, { useRef, useState } from "react";
import CustomKeyboardAvoidingView from "./components/CustomKeyboardAvoidingView";
import CustomTextInput from "./components/CustomTextInput";
import { useNavigation } from "expo-router";
import { COLORS } from "@/src/consts/colors";
import { ChevronLeft } from "lucide-react-native";
import Loader from "./components/Loader";
import { useAuth } from "../context/authProvider";
import { StackNavigationProp } from "../types/stackParam";
import { UserInfoErrorProps, UserInfoProps } from "../types/auth";
import { defaultBooleanValue, defaultStringValue } from "../consts/defaults";
import { stepRequirements } from "../consts/maps";

export default function Register() {
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [currentIndex, setCurrentIndex] = useState<number>(1);

    const { register, isLoading } = useAuth();

    const navigation: StackNavigationProp = useNavigation();

    const { width } = Dimensions.get("window");

    const scrollRef = useRef<ScrollView>(null);

    const [userInfo, setUserInfo] = useState<UserInfoProps>(defaultStringValue);
    const [errState, setErrState] =
        useState<UserInfoErrorProps>(defaultBooleanValue);
    const [errMsg, setErrMsg] = useState("");

    const isStepValid = (step: number): boolean => {
        const requiredFields = stepRequirements[step as 1 | 2 | 3];
        if (!requiredFields) return true;

        let valid = true;
        const newErrState: UserInfoErrorProps = { ...defaultBooleanValue };
        let message = "";

        for (const field of requiredFields) {
            if (!userInfo[field as keyof UserInfoProps]?.trim()) {
                newErrState[field as keyof UserInfoErrorProps] = true;
                message = "Please fill in all required fields.";
                valid = false;
            }
        }

        // Extra check for passwords match on step 2
        if (step === 2 && userInfo.password !== userInfo.confirmPassword) {
            newErrState.password = true;
            newErrState.confirmPassword = true;
            message = "Passwords do not match.";
            valid = false;
        }

        setErrState(newErrState);
        setErrMsg(message);

        return valid;
    };

    const handleNext = () => {
        if (!isStepValid(currentIndex)) return;

        scrollRef.current?.scrollTo({
            x: width * currentIndex,
            animated: true,
        });

        setCurrentIndex((prev) => Math.min(prev + 1, 3));
    };

    const handleBack = () => {
        scrollRef.current?.scrollTo({
            x: width * (currentIndex - 2),
            animated: true,
        });
        setCurrentIndex((prevIndex) => (prevIndex > 1 ? prevIndex - 1 : 1));
    };

    const handleRegister = async () => {
        try {
            if (userInfo.phoneNumber === "" || userInfo.email === "") {
                throw new Error("Missing Details");
            }

            await register(
                userInfo.firstName,
                userInfo.lastName,
                userInfo.email,
                userInfo.password,
                userInfo.phoneNumber,
            );
        } catch (err) {
            if (err instanceof Error) {
                setErrMsg(err.message);
                console.error(err.message);
            }
        }
    };

    return (
        <CustomKeyboardAvoidingView>
            <View className="bg-background flex-1 justify-center items-center gap-4">
                <View className="max-w-sm w-full flex flex-row gap-4 pb-4 border-b border-border items-center">
                    <TouchableOpacity
                        onPress={() =>
                            currentIndex === 1
                                ? navigation.navigate("login")
                                : handleBack()
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
                                error={errState.firstName}
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
                                error={errState.lastName}
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
                                error={errState.password}
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
                                error={errState.confirmPassword}
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
                                error={errState.phoneNumber}
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
                                error={errState.email}
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
                {errMsg && (
                    <Text className="text-danger text-center text-sm">
                        {errMsg}
                    </Text>
                )}
                <View className="flex flex-row w-full gap-4 max-w-sm justify-between">
                    <TouchableOpacity
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
                    </TouchableOpacity>
                </View>
            </View>
        </CustomKeyboardAvoidingView>
    );
}
