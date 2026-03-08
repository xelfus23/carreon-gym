import { useUserProfile } from "@/src/context/profileProvider";
import { useEffect } from "react";
import { Modal, Text, View } from "react-native";
import CustomKeyboardAvoidingView from "../CustomKeyboardAvoidingView";

export default function UserInputModal() {
    const { profile } = useUserProfile();

    return (
        <Modal transparent>
            <CustomKeyboardAvoidingView>
                <View className="bg-background/40 flex-1">
                    <View className="">
                        <Text>Please complete your profile information.</Text>
                    </View>
                </View>
            </CustomKeyboardAvoidingView>
        </Modal>
    );
}
