import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import React from "react";

export default function CustomKeyboardAvoidingView({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <KeyboardAvoidingView
            className="flex-1 bg-background"
            behavior={"padding"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            {children}
        </KeyboardAvoidingView>
    );
}
