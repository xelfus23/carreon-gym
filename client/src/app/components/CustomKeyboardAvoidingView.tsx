import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import React from "react";

export default function CustomKeyboardAvoidingView({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            >
                <View style={{ flex: 1 }}>{children}</View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}
