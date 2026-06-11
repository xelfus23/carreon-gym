import React from 'react';
import {
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';

interface KeyboardScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
}

export default function KeyboardScreen({
  children,
  scrollable = true,
}: KeyboardScreenProps) {
  if (!scrollable) {
    // For chat screens — no scroll, keyboard pushes content up
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={90}>
          <View style={{ flex: 1 }}>{children}</View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20} // extra breathing room below the focused input
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>{children}</View>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}