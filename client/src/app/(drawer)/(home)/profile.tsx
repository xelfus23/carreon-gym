import { useUserProfile } from "@/src/context/profileContext";
import { View, Text, TextInput, Image } from "react-native";

export default function Profile() {
    const { profile } = useUserProfile();

    return (
        <View className="bg-background flex-1 p-4">
            <View className="items-end gap-4 flex-row pb-8 pt-4">
                <Image
                    className="aspect-square h-44 bg-background rounded-full border-2 border-primary"
                    resizeMode="center"
                    source={require("../../../assets/ui/profile-placeholder.png")}
                />

                <View className="">
                    <View className="pl-4 flex-row items-center justify-start">
                        <Text className="text-text-primary">Username:</Text>
                        <TextInput
                            value={`@${profile?.username || "Username"}`}
                            editable={false}
                            className="text-text-secondary align-middle text-md"
                        />
                    </View>
                    <View className="flex-row items-center justify-start">
                        <Text className="text-text-primary">Email:</Text>
                        <TextInput
                            value={`${profile?.email|| "Username"}`}
                            editable={false}
                            className="text-text-secondary align-middle text-md"
                        />
                    </View>
                </View>
            </View>

            <View className="w-full bg-surface rounded-2xl gap-4 p-4">
                <View>
                    <Text className="text-text-primary">First Name</Text>
                    <TextInput
                        editable={false}
                        className="text-text-secondary"
                        value={profile?.firstName
                            .split(" ")
                            .map((v) => v.charAt(0).toUpperCase() + v.slice(1))
                            .join(" ")}
                    />
                </View>
                <View>
                    <Text className="text-text-primary">Last Name</Text>
                    <TextInput
                        editable={false}
                        className="text-text-secondary"
                        value={
                            profile?.lastName.charAt(0).toUpperCase() +
                            profile?.lastName.slice(1)!
                        }
                    />
                </View>
            </View>
        </View>
    );
}
