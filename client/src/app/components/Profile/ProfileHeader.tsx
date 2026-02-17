import { useUserProfile } from "@/src/context/profileContext";
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { displayValue } from "@/src/utils/displayValue";

export default function ProfileHeader() {
    const { profile } = useUserProfile();

    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // const pickImage = async () => {
    //     try {
    //         const { status } =
    //             await ImagePicker.requestMediaLibraryPermissionsAsync();

    //         if (status !== "granted") {
    //             Alert.alert(
    //                 "Permission Required",
    //                 "Sorry, we need camera roll permissions to change your profile picture.",
    //                 [{ text: "OK" }],
    //             );
    //             return;
    //         }

    //         // Launch image picker
    //         const result = await ImagePicker.launchImageLibraryAsync({
    //             mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //             allowsEditing: true,
    //             aspect: [1, 1],
    //             quality: 0.8,
    //         });

    //         if (!result.canceled && result.assets[0]) {
    //             setUploadingImage(true);
    //             const imageUri = result.assets[0].uri;

    //             // TODO: Upload to AWS S3
    //             // For now, just set local state
    //             setProfileImage(imageUri);

    //             // You would call your upload function here
    //             // await uploadProfileImage(imageUri);

    //             setUploadingImage(false);
    //         }
    //     } catch (error) {
    //         console.error("Error picking image:", error);
    //         Alert.alert("Error", "Failed to pick image. Please try again.");
    //         setUploadingImage(false);
    //     }
    // };

    // const takePhoto = async () => {
    //     try {
    //         const { status } =
    //             await ImagePicker.requestCameraPermissionsAsync();

    //         if (status !== "granted") {
    //             Alert.alert(
    //                 "Permission Required",
    //                 "Sorry, we need camera permissions to take a photo.",
    //                 [{ text: "OK" }],
    //             );
    //             return;
    //         }

    //         const result = await ImagePicker.launchCameraAsync({
    //             allowsEditing: true,
    //             aspect: [1, 1],
    //             quality: 0.8,
    //         });

    //         if (!result.canceled && result.assets[0]) {
    //             setUploadingImage(true);
    //             const imageUri = result.assets[0].uri;
    //             setProfileImage(imageUri);

    //             // await uploadProfileImage(imageUri);

    //             setUploadingImage(false);
    //         }
    //     } catch (error) {
    //         console.error("Error taking photo:", error);
    //         Alert.alert("Error", "Failed to take photo. Please try again.");
    //         setUploadingImage(false);
    //     }
    // };

    const showImageOptions = () => {
        Alert.alert(
            "Profile Picture",
            "Choose an option",
            [
                {
                    text: "Take Photo",
                    // onPress: takePhoto,
                },
                {
                    text: "Choose from Library",
                    // onPress: pickImage,
                },
                {
                    text: "Cancel",
                    style: "cancel",
                },
            ],
            { cancelable: true },
        );
    };

    return (
        <View className="items-center gap-4 pb-8 pt-4">
            <View className="relative">
                <Image
                    className="aspect-square h-32 w-32 bg-surface rounded-full border-2 border-primary"
                    resizeMode="center"
                    source={
                        profileImage
                            ? { uri: profileImage }
                            : profile?.profileImageUrl
                              ? { uri: profile.profileImageUrl }
                              : require("../../../assets/ui/profile-placeholder.png")
                    }
                />
                {/* Edit button for profile picture */}
                <TouchableOpacity
                    className="absolute bottom-0 right-0 bg-primary rounded-full p-2.5 border-2 border-background"
                    onPress={showImageOptions}
                    disabled={uploadingImage}
                >
                    <Text className="text-background text-xs font-bold">
                        {uploadingImage ? "..." : "✎"}
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="items-center gap-1">
                <Text className="text-text-primary text-2xl font-bold">
                    {displayValue(
                        profile?.firstName && profile?.lastName
                            ? `${profile.firstName
                                  .split(" ")
                                  .map(
                                      (v) =>
                                          v.charAt(0).toUpperCase() +
                                          v.slice(1),
                                  )
                                  .join(" ")} ${
                                  profile.lastName.charAt(0).toUpperCase() +
                                  profile.lastName.slice(1)
                              }`
                            : null,
                        "User Name",
                    )}
                </Text>
                {/* <Text className="text-text-secondary text-sm">
                    @{displayValue(profile?.username, "username")}
                </Text> */}
                <Text className="text-text-secondary text-sm">
                    {displayValue(profile?.email, "email@example.com")}
                </Text>
            </View>
        </View>
    );
}
