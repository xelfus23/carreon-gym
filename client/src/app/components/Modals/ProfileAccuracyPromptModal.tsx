import { View, Text, TouchableOpacity, Modal } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserRound } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";

interface ProfileAccuracyPromptModalProps {
  visible: boolean;
  onContinue: () => void;
  onMaybeLater: () => void;
}

export default function ProfileAccuracyPromptModal({
  visible,
  onContinue,
  onMaybeLater,
}: ProfileAccuracyPromptModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/60 justify-center px-6">
        <SafeAreaView className="bg-surface rounded-3xl border border-border overflow-hidden">
          <View className="p-6 items-center">
            <View className="bg-primary/15 p-4 rounded-full mb-4">
              <UserRound size={32} color={COLORS.primary} />
            </View>

            <Text className="text-text-primary font-bold text-xl text-center mb-2">
              Improve AI Accuracy
            </Text>

            <Text className="text-text-secondary text-center text-base leading-relaxed mb-6">
              Your AI trainer gives better workout and nutrition advice when it
              knows your body fat percentage and muscle mass. Would you like to
              add these now?
            </Text>

            <TouchableOpacity
              onPress={onContinue}
              className="w-full bg-primary py-4 rounded-2xl items-center mb-3"
            >
              <Text className="text-background font-bold text-base">
                Continue — Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onMaybeLater}
              className="w-full py-4 rounded-2xl items-center border border-border"
            >
              <Text className="text-text-secondary font-semibold text-base">
                Maybe Later
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
