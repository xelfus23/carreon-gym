import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import React from "react";
import { Scroll } from "lucide-react-native";

export default function CustomKeyboardAvoidingView({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <KeyboardAvoidingView
            className="flex-1"
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
            <ScrollView className="flex-1" contentContainerClassName="flex-1">
                {children}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
