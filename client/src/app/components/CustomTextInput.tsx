import { COLORS } from "@/src/consts/colors";
import { KeyboardTypeOptions, Pressable, TextInput, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

interface TextInputProps {
    placeholder: string;
    className?: string;
    secureTextEntry?: boolean;
    setSecureTextEntry?: (value: boolean) => void;
    value?: string;
    onChangeText?: (text: string) => void;
}

const KeyboardTypes: Record<string, string> = {
    username: "default",
    email: "email-address",
    password: "default",
};

export default function CustomTextInput({
    placeholder,
    className,
    secureTextEntry,
    value,
    onChangeText,
    setSecureTextEntry,
}: TextInputProps) {
    return (
        <View className="flex flex-row">
            <TextInput
                placeholder={placeholder}
                placeholderTextColor={COLORS.textSecondary}
                className={`${className} bg-surface font-inter rounded-xl px-4 py-4 text-xl text-text-primary flex-1`}
                secureTextEntry={secureTextEntry}
                value={value}
                autoCorrect={false}
                spellCheck={false}
                autoCapitalize="none"
                keyboardType={KeyboardTypes[placeholder] as KeyboardTypeOptions}
                onChangeText={onChangeText}
            />
            {placeholder === "Password" && (
                <View className="flex justify-center">
                    <Pressable
                        onPress={() =>
                            setSecureTextEntry &&
                            setSecureTextEntry(!secureTextEntry)
                        }
                        className="px-4"
                    >
                        {secureTextEntry ? (
                            <Eye size={30} color={COLORS.textPrimary} />
                        ) : (
                            <EyeOff size={30} color={COLORS.textPrimary} />
                        )}
                    </Pressable>
                </View>
            )}
        </View>
    );
}
