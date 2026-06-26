import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { COLORS } from "@/src/consts/colors";
import {
  AiPreferences,
  DEFAULT_AI_PREFERENCES,
  TONE_OPTIONS,
  LANGUAGE_OPTIONS,
  DETAIL_OPTIONS,
} from "@/src/types/aiPreferences";
import { getAiPreferences, saveAiPreferences } from "@/src/utils/aiPreferences";

interface AiPersonalizationModalProps {
  visible: boolean;
  onClose: () => void;
}

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; description?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="mb-6">
      <Text className="text-text-primary font-bold text-sm uppercase tracking-wider mb-3">
        {label}
      </Text>
      <View className="gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              className={`p-4 rounded-2xl border ${selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface"
                }`}
            >
              <Text
                className={`font-semibold ${selected ? "text-primary" : "text-text-primary"
                  }`}
              >
                {opt.label}
              </Text>
              {opt.description && (
                <Text className="text-text-secondary text-xs mt-1">
                  {opt.description}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function RadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="mb-6">
      <Text className="text-text-primary font-bold text-sm uppercase tracking-wider mb-3">
        {label}
      </Text>
      <View className="bg-surface rounded-2xl border border-border overflow-hidden">
        {options.map((opt, index) => {
          const selected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.7}
              className={`flex-row items-center px-4 py-4 ${index < options.length - 1 ? "border-b border-border" : ""
                }`}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${selected ? "border-primary" : "border-text-secondary"
                  }`}
              >
                {selected && (
                  <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </View>
              <Text
                className={`text-base ${selected
                    ? "text-primary font-semibold"
                    : "text-text-primary"
                  }`}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function AiPersonalizationModal({
  visible,
  onClose,
}: AiPersonalizationModalProps) {
  const [prefs, setPrefs] = useState<AiPreferences>(DEFAULT_AI_PREFERENCES);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    getAiPreferences().then(setPrefs);
  }, [visible]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAiPreferences(prefs);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
          <Text className="text-text-primary font-bold text-xl">
            AI Personalization
          </Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <Text className="text-text-secondary text-sm mb-6">
            Customize how your AI trainer responds. These settings apply to new
            messages in this session.
          </Text>

          <OptionGroup
            label="Tone"
            options={TONE_OPTIONS}
            value={prefs.tone}
            onChange={(tone) => setPrefs((p) => ({ ...p, tone }))}
          />

          <RadioGroup
            label="Language"
            options={LANGUAGE_OPTIONS}
            value={prefs.language}
            onChange={(language) => setPrefs((p) => ({ ...p, language }))}
          />

          <OptionGroup
            label="Response Detail"
            options={DETAIL_OPTIONS}
            value={prefs.detailLevel}
            onChange={(detailLevel) =>
              setPrefs((p) => ({ ...p, detailLevel }))
            }
          />
        </ScrollView>

        <View className="px-5 pb-6 pt-3 border-t border-border">
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className={`py-4 rounded-2xl items-center ${saving ? "bg-primary/50" : "bg-primary"
              }`}
          >
            <Text className="text-background font-bold text-base">
              {saving ? "Saving..." : "Save Preferences"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
