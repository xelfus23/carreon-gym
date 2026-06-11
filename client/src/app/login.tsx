import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { ArrowLeft } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";
import { useNavigation } from "expo-router";
import CustomTextInput from "./components/CustomTextInput";
import Loader from "./components/Loader";
import { useAuth } from "../context/authProvider";
import { StackNavigationProp } from "../types/stackParam";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

export default function Login() {
  const navigation: StackNavigationProp = useNavigation();
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const [email, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    try {
      if (email === "" || password === "") {
        throw new Error("Enter email and Password");
      }
      await login(email, password);
    } catch (err) {
      if (err instanceof Error) {
        setErrMsg(err.message);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View className="container max-w-sm gap-4 w-full">
          <View className="flex-row gap-4 pb-4 border-border border-b items-center">
            <TouchableOpacity onPress={() => navigation.navigate("index")}>
              <ArrowLeft color={COLORS.textSecondary} size={24} />
            </TouchableOpacity>

            <Text className="text-primary text-4xl font-interBold h-14 align-middle">
              Login
            </Text>
          </View>
          <View className="flex-col gap-4">
            <CustomTextInput
              error={errMsg !== ""}
              placeholder="Email or Phone Number"
              onChangeText={(e) => setUsername(e)}
            />
            <CustomTextInput
              error={errMsg !== ""}
              placeholder="Password"
              secureTextEntry={secureTextEntry}
              setSecureTextEntry={setSecureTextEntry}
              onChangeText={(e) => setPassword(e)}
            />
          </View>
          {errMsg !== "" && (
            <Text className="text-danger text-center text-sm">{errMsg}</Text>
          )}
          <TouchableOpacity
            onPress={handleLogin}
            className={`${isLoading ? "bg-surface" : "bg-primary"} rounded-xl w-full transition-all hover:bg-blue-400`}
          >
            <Text className="text-background px-8 py-4 text-xl font-interBold text-center">
              {isLoading ? <Loader /> : "Login"}
            </Text>
          </TouchableOpacity>
          <Text className="text-text-secondary text-center flex items-center justify-center">
            Don&apos;t have account?{" "}
            <Text
              onPress={() => navigation.navigate("register")}
              className="text-primary-dark"
            >
              Register now!
            </Text>
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
