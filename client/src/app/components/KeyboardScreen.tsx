// components/layout/KeyboardScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface KeyboardScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
}

export default function KeyboardScreen({
  children,
  scrollable = true
}: KeyboardScreenProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    // Listeners to capture exactly what the keyboard is doing on Android
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0); // FORCES padding back to absolute 0
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // If iOS, let standard KeyboardAvoidingView handle it (since it works cleanly there)
  if (Platform.OS === 'ios') {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
        <KeyboardAvoidingView behavior="padding" className="flex-1" keyboardVerticalOffset={90}>
          {scrollable ? (
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" className="flex-1">
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1">{children}</View>
              </TouchableWithoutFeedback>
            </ScrollView>
          ) : (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View className="flex-1">{children}</View>
            </TouchableWithoutFeedback>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      <View
        className="flex-1"
        style={{
          paddingBottom: keyboardHeight,
          flex: 1,
        }}      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            className="flex-1"
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View className="flex-1">
                {children}
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1">
              {children}
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>
    </SafeAreaView>
  );
}