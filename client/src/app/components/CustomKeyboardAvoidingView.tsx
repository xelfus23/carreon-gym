import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import React from "react";

export default function CustomKeyboardAvoidingView({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <KeyboardAvoidingView
            style={{
                flex: 1,
            }}
            behavior={Platform.OS === "ios" ? "padding" : "padding"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
            {children}
        </KeyboardAvoidingView>
    );
}
