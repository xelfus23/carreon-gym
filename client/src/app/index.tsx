import { Image, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "expo-router";
import { RootStackParamList } from "../types/stackParam";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function Start() {
  const navigation: NavigationProp = useNavigation();

  return (
    <View className="bg-background flex-1 items-center justify-center">
      <View className="container max-w-sm flex items-center justify-center gap-4">
        <Image
          className="h-44"
          resizeMode="contain"
          source={require("../assets/ui/brand-logo.png")}
        />
        <Text className="text-text-primary text-sm uppercase text-center font-inter">Fitness Gym Mobile App</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("login")}
          className="bg-primary rounded-full"
        >
          <Text className="text-background font-interBold px-8 py-4 text-xl">
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
